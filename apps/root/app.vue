<template>
  <QLayout view="hHh lpR fFf">
    <QHeader
      bordered
      class="bg-white text-black !dark:(bg-#121212 text-white) select-none"
    >
      <QToolbar class="min-h-unset">
        <QToolbarTitle shrink>
          <TopbarHomeButton />
        </QToolbarTitle>
        <QSpace />
        <div>
          <TopbarAuthenticatedUser />
          <TopbarUnauthenticatedUser />
          <TopbarLoginButton />
        </div>
      </QToolbar>
    </QHeader>

    <QPageContainer>
      <slot>
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
      </slot>
    </QPageContainer>
  </QLayout>
</template>
