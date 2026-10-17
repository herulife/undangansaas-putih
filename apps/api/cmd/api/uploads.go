package main

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

const maxUploadSize = 12 << 20

type uploadResponse struct {
	FileName string `json:"fileName"`
	URL      string `json:"url"`
	Type     string `json:"type"`
	Size     int64  `json:"sizeBytes"`
}

func (a *app) uploadMedia(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		writeError(w, http.StatusBadRequest, errors.New("invalid multipart upload"))
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, errors.New("file is required"))
		return
	}
	defer file.Close()

	head := make([]byte, 512)
	n, _ := io.ReadFull(file, head)
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		writeError(w, http.StatusBadRequest, errors.New("uploaded file is not seekable"))
		return
	}

	contentType := http.DetectContentType(head[:n])
	mediaType, ext, ok := uploadKind(contentType, header.Filename)
	if !ok {
		writeError(w, http.StatusBadRequest, errors.New("only image or audio uploads are supported"))
		return
	}

	// Enforce storage limit per tier.
	features := featuresForUser(user, time.Now()).Features
	if features.StorageLimitBytes > 0 {
		var used int64
		if err := a.db.QueryRow(r.Context(), `
			select coalesce(sum(size_bytes), 0)
			from media_assets
			where user_id = $1::uuid
		`, user.ID).Scan(&used); err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}
		if used+int64(header.Size) > features.StorageLimitBytes {
			writeError(w, http.StatusRequestEntityTooLarge, errors.New("storage limit reached for current tier"))
			return
		}
	}

	dir := filepath.Join(uploadDir(), mediaType, user.ID)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	fileName := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
	path := filepath.Join(dir, fileName)
	out, err := os.Create(path)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	if _, err := io.Copy(out, io.LimitReader(file, maxUploadSize)); err != nil {
		out.Close()
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	out.Close()

	// Best-effort WebP conversion for images when cwebp is available.
	if mediaType == "images" && ext != ".webp" {
		if converted, ok := convertToWebP(path); ok {
			_ = os.Remove(path)
			fileName = converted.fileName
			path = converted.path
		}
	}

	info, err := os.Stat(path)
	sizeBytes := int64(0)
	if err == nil {
		sizeBytes = info.Size()
	}

	url := fmt.Sprintf("/api/uploads/%s/%s/%s", mediaType, user.ID, fileName)
	if _, err := a.db.Exec(r.Context(), `
		insert into media_assets (user_id, file_name, url, media_type, provider, size_bytes)
		values ($1::uuid, $2, $3, $4, 'local', $5)
	`, user.ID, fileName, url, mediaType, sizeBytes); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	writeJSON(w, uploadResponse{
		FileName: fileName,
		URL:      url,
		Type:     mediaType,
		Size:     sizeBytes,
	})
}

type convertedWebP struct {
	fileName string
	path     string
}

func convertToWebP(path string) (convertedWebP, bool) {
	if _, err := exec.LookPath("cwebp"); err != nil {
		return convertedWebP{}, false
	}
	target := strings.TrimSuffix(path, filepath.Ext(path)) + ".webp"
	cmd := exec.Command("cwebp", "-quiet", "-q", "80", path, "-o", target)
	if err := cmd.Run(); err != nil {
		_ = os.Remove(target)
		return convertedWebP{}, false
	}
	if _, err := os.Stat(target); err != nil {
		return convertedWebP{}, false
	}
	return convertedWebP{fileName: filepath.Base(target), path: target}, true
}

func uploadKind(contentType string, fileName string) (string, string, bool) {
	ext := strings.ToLower(filepath.Ext(fileName))
	switch {
	case strings.HasPrefix(contentType, "image/"):
		if ext == "" || ext == ".jfif" {
			ext = ".jpg"
		}
		return "images", ext, true
	case strings.HasPrefix(contentType, "audio/"):
		if ext == "" {
			ext = ".mp3"
		}
		return "audio", ext, true
	default:
		return "", "", false
	}
}
