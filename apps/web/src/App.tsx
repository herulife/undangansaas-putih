import { useAuthSession } from './app/api'
import { findInvitation } from './app/format'
import { useAPIData } from './app/useAPIData'
import { LoadingPage, NotFoundPage } from './components/common'
import { AuthPage, ForgotPasswordPage, ResetPasswordPage, VerifyEmailPage } from './pages/AuthPages'
import { BuilderPreviewPage, DirectTemplatePreviewPage } from './pages/BuilderPreviewPage'
import { HomePage } from './pages/HomePage'
import { TemplatesPage } from './pages/TemplatesPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { EditorPage } from './pages/editor/EditorPage'
import { AdminConsolePage } from './modules/admin/AdminConsolePage'
import { PrivacyPage, RefundPage, TermsPage } from './pages/legal/LegalPages'
import { PublicInvitationPage } from './pages/public/PublicInvitationPage'
import { templateRegistry } from './templateEngine'
import { lazy, Suspense, useEffect } from 'react'

const LinkundanganStyleMockupPage = lazy(() =>
  import('./pages/mockup/MockupPage').then((module) => ({ default: module.LinkundanganStyleMockupPage })),
)

export function App() {
  const pathname = window.location.pathname
  const authSession = useAuthSession()
  const {
    checkSlugAvailable,
    createInvitation,
    createMidtransPayment,
    duplicateInvitation,
    editorMessage,
    formMessage,
    generateImage,
    generatedImages,
    imageMessage,
    invitations,
    isCreating,
    isDataLoading,
    isGeneratingImage,
    isPublishing,
    isSubmittingRSVP,
    isUpdating,
    loadPublicInvitation,
    loadRSVPs,
    loadTrash,
    publicInvitations,
    publicInvitationStatus,
    publishInvitation,
    publishMessage,
    restoreInvitation,
    rsvpMessage,
    rsvpsBySlug,
    source,
    submitRSVP,
    isAdminSaving,
    paymentMessage,
    registerTemplate,
    submitManualProof,
    templateMessage,
    templates,
    trashInvitation,
    trashedInvitations,
    updateInvitation,
    uploadProof,
    validateVoucher,
  } = useAPIData(authSession.auth.token)

  const publicSlug = pathname.startsWith('/u/')
    ? pathname.split('/').filter(Boolean)[1] ?? ''
    : ''

  useEffect(() => {
    if (publicSlug) {
      void loadPublicInvitation(publicSlug)
    }
  }, [loadPublicInvitation, publicSlug])

  if (pathname.startsWith('/verify-email')) {
    return <VerifyEmailPage />
  }

  if (pathname.startsWith('/terms')) {
    return <TermsPage />
  }

  if (pathname.startsWith('/privacy')) {
    return <PrivacyPage />
  }

  if (pathname.startsWith('/refund')) {
    return <RefundPage />
  }

  if (pathname.startsWith('/forgot-password')) {
    return <ForgotPasswordPage />
  }

  if (pathname.startsWith('/reset-password')) {
    return <ResetPasswordPage />
  }

  if (pathname.startsWith('/login')) {
    return (
      <AuthPage
        authMessage={authSession.authMessage}
        isAuthenticating={authSession.isAuthenticating}
        mode="login"
        onAuthenticate={authSession.authenticate}
      />
    )
  }

  if (pathname.startsWith('/register')) {
    return (
      <AuthPage
        authMessage={authSession.authMessage}
        isAuthenticating={authSession.isAuthenticating}
        mode="register"
        onAuthenticate={authSession.authenticate}
      />
    )
  }

  if (pathname.startsWith('/dashboard/edit/')) {
    if (!authSession.auth.token) {
      return (
        <AuthPage
          authMessage="Silakan login dulu untuk membuka editor."
          isAuthenticating={authSession.isAuthenticating}
          mode="login"
          onAuthenticate={authSession.authenticate}
        />
      )
    }
    const slug = pathname.split('/').filter(Boolean)[2] ?? ''
    const invitation = findInvitation(slug, invitations)
    if (!invitation && isDataLoading) {
      return <LoadingPage title="Memuat editor undangan..." />
    }
    if (!invitation) {
      return <NotFoundPage title="Undangan tidak ditemukan" description="Data ini tidak ada di akun yang sedang login." />
    }
    return (
      <EditorPage
        editorMessage={editorMessage}
        invitation={invitation}
        isPublishing={isPublishing}
        isUpdating={isUpdating}
        loadRSVPs={loadRSVPs}
        publishInvitation={publishInvitation}
        publishMessage={publishMessage}
        rsvps={rsvpsBySlug[slug] ?? []}
        updateInvitation={updateInvitation}
      />
    )
  }

  if (pathname.startsWith('/admin')) {
    if (!authSession.auth.token) {
      return (
        <AuthPage
          authMessage="Silakan login admin dulu."
          isAuthenticating={authSession.isAuthenticating}
          mode="login"
          onAuthenticate={authSession.authenticate}
        />
      )
    }
    if (authSession.auth.user?.role !== 'admin') {
      window.location.href = '/dashboard'
      return null
    }
    return (
      <AdminConsolePage templates={templates} />
    )
  }

  if (pathname.startsWith('/dashboard')) {
    if (!authSession.auth.token) {
      return (
        <AuthPage
          authMessage="Login untuk masuk dashboard."
          isAuthenticating={authSession.isAuthenticating}
          mode="login"
          onAuthenticate={authSession.authenticate}
        />
      )
    }
    return (
      <DashboardPage
        authUser={authSession.auth.user}
        checkSlugAvailable={checkSlugAvailable}
        createInvitation={createInvitation}
        duplicateInvitation={duplicateInvitation}
        formMessage={formMessage}
        generateImage={generateImage}
        generatedImages={generatedImages}
        imageMessage={imageMessage}
        invitations={invitations}
        isAdminSaving={isAdminSaving}
        isCreating={isCreating}
        isDataLoading={isDataLoading}
        isGeneratingImage={isGeneratingImage}
        loadTrash={loadTrash}
        logout={authSession.logout}
        onCreateMidtransPayment={createMidtransPayment}
        onRegisterTemplate={registerTemplate}
        onSubmitManualProof={submitManualProof}
        onUploadProof={uploadProof}
        onValidateVoucher={validateVoucher}
        paymentMessage={paymentMessage}
        restoreInvitation={restoreInvitation}
        templateMessage={templateMessage}
        templates={templates}
        source={source}
        trashInvitation={trashInvitation}
        trashedInvitations={trashedInvitations}
      />
    )
  }

  if (pathname.startsWith('/mockup-dashboard')) {
    return (
      <Suspense fallback={<LoadingPage title="Memuat mockup..." />}>
        <LinkundanganStyleMockupPage />
      </Suspense>
    )
  }

  if (pathname.startsWith('/mockup-saas-flow') || pathname.startsWith('/mokap-saas')) {
    return (
      <Suspense fallback={<LoadingPage title="Memuat mockup..." />}>
        <LinkundanganStyleMockupPage />
      </Suspense>
    )
  }

  if (pathname.startsWith('/templates')) {
    return <TemplatesPage templates={templates} />
  }

  if (pathname.startsWith('/builder-preview')) {
    return <BuilderPreviewPage />
  }

  if (pathname.startsWith('/preview/')) {
    const templateId = pathname.split('/').filter(Boolean)[1] ?? templateRegistry[0].id
    return <DirectTemplatePreviewPage templateId={templateId} />
  }

  if (pathname.startsWith('/u/')) {
    const slug = pathname.split('/').filter(Boolean)[1] ?? ''
    const status = publicInvitationStatus[slug]
    const invitation = publicInvitations[slug]
    if (status === 'not-found') {
      return <NotFoundPage title="Undangan tidak ditemukan" description="Periksa kembali link undangan yang dibagikan." />
    }
    if (status === 'error') {
      return <NotFoundPage title="Undangan belum bisa dimuat" description="API sedang tidak tersedia atau link belum dipublish." />
    }
    if (!invitation) {
      return <LoadingPage title="Memuat undangan..." />
    }
    return (
      <PublicInvitationPage
        invitation={invitation}
        isSubmittingRSVP={isSubmittingRSVP}
        rsvpMessage={rsvpMessage}
        submitRSVP={submitRSVP}
      />
    )
  }

  return <HomePage invitations={invitations} />
}

export default App
