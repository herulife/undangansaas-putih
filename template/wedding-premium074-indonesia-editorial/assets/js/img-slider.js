document.addEventListener("DOMContentLoaded", function () {
  let imageSlider = document.getElementById("generateImageSlider");
  const galleryImages = document.querySelectorAll(
    ".gallery,#nav-cerita ul img,#nav-cerita .story img"
  );

  if (imageSlider == null) {
    imageSlider = document.querySelector(".generateImageSlider");
  }

  if (imageSlider == null) return;
  if (galleryImages.length < 2) return;

  imageSlider.innerHTML = `
    <div class="imgslide-container">
      <div class="imgSlider-bg" id="imgSliderBg"></div>
      <div class="imgSlider">
        <div class="imgSlider-images" id="imgSliderImages">
          ${buildImageSlides(galleryImages)}
          <img src="${galleryImages[0].src}" alt="1-clone">
        </div>
      </div>
      <button class="nav-button prev">&#10094;</button>
      <button class="nav-button next">&#10095;</button>
    </div>
  `;

  const imagesContainer = document.querySelector("#imgSliderImages");
  const images = imagesContainer.querySelectorAll("img");
  const background = document.getElementById("imgSliderBg");
  const totalSlides = images.length;
  const transitionTime = 500;

  let currentIndex = 0;
  let isTransitioning = false;

  const setBackgroundImage = () => {
    const realIndex = currentIndex === totalSlides - 1 ? 0 : currentIndex;
    background.style.backgroundImage = `url('${images[realIndex].src}')`;
  };

  const goToSlide = (index, withTransition = true) => {
    setBackgroundImage();
    imagesContainer.style.transition = withTransition
      ? `transform ${transitionTime}ms ease-in-out`
      : "none";
    imagesContainer.style.transform = `translateX(-${index * 100}%)`;
  };

  const nextSlide = () => {
    if (isTransitioning) return;

    isTransitioning = true;
    currentIndex++;
    goToSlide(currentIndex);

    if (currentIndex === totalSlides - 1) {
      setTimeout(() => {
        currentIndex = 0;
        goToSlide(currentIndex, false);
        isTransitioning = false;
      }, transitionTime);
      return;
    }

    setTimeout(() => {
      isTransitioning = false;
    }, transitionTime);
  };

  const prevSlide = () => {
    if (isTransitioning) return;

    if (currentIndex === 0) {
      currentIndex = totalSlides - 1;
      goToSlide(currentIndex, false);
      setTimeout(() => {
        currentIndex = totalSlides - 2;
        goToSlide(currentIndex);
      }, 20);
    } else {
      currentIndex--;
      goToSlide(currentIndex);
    }

    isTransitioning = true;
    setTimeout(() => {
      isTransitioning = false;
    }, transitionTime);
  };

  document.querySelector(".next").addEventListener("click", nextSlide);
  document.querySelector(".prev").addEventListener("click", prevSlide);

  setInterval(nextSlide, 5000);
  setBackgroundImage();
});

function buildImageSlides(galleryImages) {
  let listImgHTML = "";

  galleryImages.forEach((img, index) => {
    listImgHTML += `<img src="${img.src}" alt="${index + 1}">`;
  });

  return listImgHTML;
}
