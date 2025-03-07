<template>
  <QLayout view="hHh lpR fFf">
    <QHeader
      bordered
      class="bg-#e1e1e1 text-black select-none"
    >
      <QToolbar class="min-h-unset">
        <QToolbarTitle shrink>
          <TopbarHomeButton />
        </QToolbarTitle>
        <div id="topbar-buttons" />

        <QSpace />
        <div class="space-x-1">
          <TopbarFullscreenButton />
          <TopbarAppGrid />
          <TopbarAuthenticatedUser disable-theme />
          <TopbarUnauthenticatedUser disable-theme />
          <TopbarLoginButton />
        </div>
      </QToolbar>
    </QHeader>

    <QPageContainer>
      <slot />
    </QPageContainer>
  </QLayout>
</template>

<style>
.topbar-link.router-link-active {
  background-color: gray;
}
</style>
