<template>
  <QLayout view="hHh lpR fFf">
    <QHeader
      bordered
      class="bg-black text-white select-none"
    >
      <QToolbar class="min-h-unset">
        <QToolbarTitle shrink>
          <TwIcon
            name="i-tw:eliar"
            size="2.5rem"
            class="p-1"
          />
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
