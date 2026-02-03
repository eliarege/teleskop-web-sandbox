# Changelog

## 0.71.0 - 2026-02-03

[Compare Changes](2903a288f95d7f28dcb908ec892b670b4e5e5578...1b9cdb298f3b551a64da99c13516224bf6a2f508)

### 🚀 Features

-  **PT**: Display program and command names in step working times, improve duration formatting, and update legend colors. ([9943c16](9943c1641a798a5255fb32dbce9a56f98007fb18))

### 🐛 Bug Fixes

-  **DM**: Fix typo ([2c718e6](2c718e6007ea8a7a3c837cb7bd4e12f74be8068b))
-  **PT**: Update queries to filter batch steps by release dates and improve archival logic ([40ac447](40ac447a7df5e663cb5cf9ff0c223a36dfdcf2c8))

## 0.70.0 - 2026-02-03

[Compare Changes](c0a22bba1e68f81d087fcebd1bf97a75b590f77d...2903a288f95d7f28dcb908ec892b670b4e5e5578)

### 🚀 Features

-  **PE**: Implement CollapsibleButtonBar component and integrate it into ContextBar; add menu tooltip translations ([15d3d9b](15d3d9b9e945d1682b7b1cf0feafa7be91d9c5fe))

### 🐛 Bug Fixes

-  **PE**: Adjust startIndex calculation and validate range for step options ([0938fba](0938fba61c2344761844be8c9824335f6328ae68))
-  **PE**: Update CMMoveParallelStep and fix range selection validation issue ([7bffafb](7bffafbb189dee81f31e15786436eb9e988b665c))

## 0.69.0 - 2026-01-30

[Compare Changes](0e34d813e525fe53407c391b5e1058729eb60ea9...c0a22bba1e68f81d087fcebd1bf97a75b590f77d)

### 🚀 Features

-  **MM**: Introduce `formatDuration` utility and migrate `MachineCard/Info.vue` to use it for displaying elapsed times. ([b14ab39](b14ab39dc5b46b1fb042f663ccc2469d3485db92))

### 🐛 Bug Fixes

-  **AR**: Replace time formatting with formatDuration utility ([9788083](9788083ab04999417a3d0b7ff9ccf467a252989b))

### ♻️ Refactor

- **utils**: Rename `formatDuration.ts` to `format.ts` ([d9dbebd](d9dbebd2bc47712237e8b6eeabf05f66e0dfc6e1))

## 0.68.2 - 2026-01-30

[Compare Changes](b100cdf9c6a8b9a7e9876f69fedeaecc2e817226...0e34d813e525fe53407c391b5e1058729eb60ea9)

### 🐛 Bug Fixes

- **Dockerfile**: Update healthcheck command to use dynamic port and base URL ([2384d30](2384d30f0b15d581d6c87f991c6bbd5373ee2eca))

## 0.68.1 - 2026-01-30

[Compare Changes](cd8d83d4c31b9446a0f3f28595d970c1d4fcefe3...b100cdf9c6a8b9a7e9876f69fedeaecc2e817226)

### 🐛 Bug Fixes

- **Dockerfile**: Add curl to base image for healthcheck functionality ([40779f1](40779f16bd505e09578b076427a434177dfabc38))
- **migrations**: Correct delimiter syntax in splitListToTable function definition, add missing `END` statement at splitListToTable function ([009895d](009895d005030e1e92d5b822493b7df1439817bb))
-  **AR**: Correct translation for 'startParameters' in Turkish locale ([3c17727](3c177278022eb52c7ec93aa9553c205d69a74434))

## 0.68.0 - 2026-01-29

[Compare Changes](c2b0d3d0eabaef083a4424d7b874aac6129c3e22...cd8d83d4c31b9446a0f3f28595d970c1d4fcefe3)

### 🚀 Features

-  **AR**: Add keyboard navigation for time selection in ArchiveChart ([89aa3ad](89aa3ad550ddd9a0518f918c0998fd092ff68fc2))
-  **AR**: TW-177 enhance keyboard navigation for time selection limits in ArchiveChart ([7b23058](7b23058c6a868c6864fb32483aa62a2382c52a3b))
-  **AR**: Update time selection behavior to adjust view duration on keyboard navigation in ArchiveChart ([7e83f28](7e83f28416db205fc8386145f2cddd96363192fe))
-  **PE**: Add machine process accordion and improve machine list styling ([293c1d5](293c1d535b3c0119aa6140dcd516918f21e1b29a))
- **recipes**: JobOrderOverview revamp ([b3f0192](b3f01927cb7ae736bd7a25f9c6c4028182590570))
-  **PE**: Implement context menu for program steps and enhance step selection functionality ([63e778b](63e778bf55cf7c44672bde69fbac94f5b6715c5e))
-  **DM**: TW-180 add transferred job orders feature with API integration and UI components ([c4671cb](c4671cb2350aa3bea042c3053960abcaeee20933))
-  **DM**: TW-181 add consumption page with API integration and localization support ([c5e48f7](c5e48f76725d93cc858c8a67b855a5935ff87319))
-  **PE**: Enhance drag-and-drop functionality for machine commands and parallel steps ([942c37a](942c37abd935fe55458d3cd4eaef729adcfd61b4))
-  **PE**: Enhance machine context menu with group and process type functionalities ([8283259](8283259e7a6b14313930b9b664071f599dba8d1e))

### 🐛 Bug Fixes

-  **AR**: TW-178 adjust time selection behavior in ArchiveChart to handle out-of-bounds selections ([c497290](c49729083b4149e40d236442bb35480544832b54))
- **recipes**: Recipe fields consistency fixes ([2dca47f](2dca47fa5c6245a0f397423b39c078960fea0a8d))
- **recipes**: ProgramName not appearing in recipe screens ([9d6ff49](9d6ff49fbf537bc7f03fda3cb850ecf706f3ab38))
- **recipes**: Null program name error ([65383e8](65383e879b6d8ba899f98c2f776a3e69846a9670))
- **recipes**: Manual material main_step value ([006bfc8](006bfc80f85744d6d706f1a27d36478489d6fa77))
-  **PE**: Avoid sending START_TAGS if machine version is lower than 3.17 ([b347828](b347828ff2ea7f0092db82040803f2c4eae98dd4))
-  **PE**: Ensure newline at the end of the program string ([1d36984](1d369842f383adc833979a2a4df81b07db95aa56))
- **nuxt-base**: Update app grid button to use href for navigation instead of click event ([91115ae](91115ae68388028aaf4602afbcf146d17b320de6))
- **migrations**: Handle initial migrations ([e854486](e85448622fa88b2c6b6e3c71558b919ca74a51b8))
-  **AR**: Water type labels should be fetched from BFWaterTypes ([21cc47a](21cc47a7c92b32934d7ffa1ac859f3a10b553a0b))
-  **PE**: Always navigate to machine list when a machine is clicked if a user is on program-editor page ([e968dcd](e968dcd942b8f97bba447dd0b61c63d44ce29d02))
-  **PE**: Context menu not being shown when right-clicked on a machine in MachineList ([6d74a26](6d74a26008bcab2d7a8b6585d34d0e22311f6517))
-  **PE**: Program table cells not respecting the configured align property ([785aa44](785aa44f99d31792afd6bca3c4f2d7d75f01e0e2))
-  **PE**: Uncomment fetchCommandTypes call in onBeforeMount lifecycle hook ([2e3aaf4](2e3aaf425c83a3b5ac6713acb85e135e245cd0b8))
-  **PE**: Update q-select class for improved styling and error handling ([ed5e77a](ed5e77a455e2e8f35a66e23e72b7fea684f6abad))
- **nuxt-base**: Update visibility menu class for better styling ([85e6b34](85e6b34053a017c1f7aa14a3884e32755cd3232a))
-  **DM**: Update transferType handling to include conditional logic for filtering ([2126809](21268096023d09a6c2a88d6f044e2758ca0e33cd))

### ♻️ Refactor

-  **MS**: Update LRUCache configurations and add debug logging for machine status fetching ([8caf64a](8caf64ade88c2d2153a98978554379c977894959))
- Move `base64` and `nearley` plugins to `nuxt-base` ([b8abe2f](b8abe2f9291835b070a14cc172b15ebd07061737))
-  **PE**: Improve ping method implementation in T7ProgramClient and TonelloProgramClient ([1af9e5e](1af9e5ea4d3e3a0d163908eb703e4721fc682d55))
- **recipes**: Streamline PDF font handling by importing fonts as base64 ([3090438](30904382371abf27582fca6cc7233fc2e7bc44c3))
-  **DM**: Remove job order logs page and enhance recipe page with detailed functionality ([2baa8d4](2baa8d419b8c5131e938c20a016d7775009cbf5d))
-  **DM**: Standardize naming conventions for jobOrder, machineId, and related fields across API and localization files ([774f405](774f405bedeec4191128c9254e05415ec073fd59))

### 🔧 Miscellaneous Tasks

- **recipes**: Removed WeighingInfoDialog and MaterialRequestsDialog from JobOrderList ([c9b1cb8](c9b1cb800bce7b520af0e2e66832ff26c531ddb9))
- **recipes**: Cleaned up unused WeighingInfo and MaterialRequests components ([d80500d](d80500dd0e659b49171eb21438e4a92107dbc2d6))
- **recipes**: Localizations ([6f3eaf1](6f3eaf177ff8ddb149a29f6abe7d974a9a67b587))
- Remove unused font files and shims, update nearley integration ([cdab750](cdab750b4ad40875302e32dabc8e367079c0a083))

## 0.67.0 - 2026-01-22

[Compare Changes](ba8d00367e8eb3d9b981ef10bc3c095ce04be388...c2b0d3d0eabaef083a4424d7b874aac6129c3e22)

### 🚀 Features

-  **PE**: Add focus sentinel to automatically append a step at the end of the program ([ea33578](ea33578f484b6e9455380e898646be9c19ba9906))
-  **PE**: Add expand/collapse functionality for program steps and improve state management ([924b639](924b63999eebd42ecc6e9ac5880395d25eadfdde))
- **docker**: Add healthcheck for nuxt apps ([ca5034c](ca5034c3ce3bb65fba7bba638a8990a8426e5e6d))
- **playground**: Implement unsaved changes dialog guard and related components ([4da4d0f](4da4d0ffca1a5a4250509770fcd94713b04cf4b7))
- **nuxt-base**: Add ConfirmDialog component for user confirmation dialogs ([ba644b4](ba644b48200d4538afbc81373e500f972c93c23a))
- **nuxt-base**: Unsaved-changes layer ([7f4e4b5](7f4e4b58702bef32d1ccd83891730ee05fccc53e))
- **nuxt-base**: Enhance unsaved changes dialog with improved messages and actions ([6bc76b1](6bc76b18587690bc3d27ef2da52d91d389533e0c))
- **nuxt-base**: Enhance ConfirmDialog with focus trap and customizable close button, move cancel button to left ([d0bcf33](d0bcf338ddd3c9e166721bc3953c903e4919c25c))

### 🐛 Bug Fixes

-  **PE**: Enhance QSelect component with custom selection display and focus handling ([d7e7b2d](d7e7b2df52ff27b27455bc4111448fa1fda47c27))
- **nuxt-base**: Correct import paths for FeedbackDialog component ([5c01b6d](5c01b6d378b4ec1e021a99926286a924f1372671))
- **quasar**: Always pass Event object to dialog `beforeHide` and `hide` events ([77375e4](77375e41d6d6ea9b6b62b062aa79274f4217abfd))

### ♻️ Refactor

-  **PE**: Simplify command label retrieval and update QSelect options ([0f3fbba](0f3fbbad2a3d3e4a9d774e327b411faa5934044a))
-  **MA**: Rename `ConfirmDialog` to `MaConfirmDialog` to avoid confusion with the `nuxt-base` variant ([8e55b05](8e55b056104af92717f5a82de29b27fdb416c484))
- **nuxt-base**: Move feedback related functionality to a separate layer, add `useFeedback` composable ([bd09e88](bd09e88f2b1169f0eee20bf03bca8a272e8767fb))
- Topbar setting items are managed via registry ([ab278fc](ab278fc1c787ae5f5902ae4a8fe15f0973922f74))

### 🔧 Miscellaneous Tasks

- **nuxt-base**: Remove localization messages now defined in layers ([fc3d134](fc3d1345e815d33dc2cd2c5a55d5183bf5904e90))
- **playground**: Remove unsaved-changes components and composables from playground ([d4d5d70](d4d5d70496644d8b7490e7326dd33bf0c0692f54))
- Update lockfile ([b158efc](b158efc0bec533033bc919bc0914eddb224e659b))

## 0.66.0 - 2026-01-16

[Compare Changes](9b6c5dd270b0fff2318d587fb8e9d590f4713f8a...ba8d00367e8eb3d9b981ef10bc3c095ce04be388)

### 🚀 Features

-  **PE**: The calculation of program status colors in the programs table has been moved to the backend. ([6ccabf2](6ccabf2170c6935a173dd33a7f104c99a4656f7e))
-  **PE**: Enhance ContextBar integration with dynamic props and contextBarButtons state ([43d1504](43d1504f355654d6a13689b1347181f8df867636))
-  **PE**: Refactor ContextBar to use props for program and machine data, enhancing reactivity and maintainability ([24e8f3c](24e8f3cef95f720c6e0eb5c814823a20338c6698))
-  **PE**: Sort program headers by program number before assigning row colors ([2c275f6](2c275f60c63493e0edbf7a88d766e651b6eef2e9))
-  **PE**: Update program state and header after successful upload ([a673087](a67308772d55d0b4e67691ce21f1f388d6c605f9))
-  **PE**: Set program state and updated timestamp during program insertion ([7fb02e2](7fb02e2a8bb68db83e1414f5147fde30b742c7b2))
-  **PE**: Enhance machine status handling with machine names and improve localization ([db40719](db40719d52c03c23b61a81829bf0f82436976adf))
-  **PE**: Refactor ContextBar to use defineModel for drawer states and clean up emit logic ([448d1bc](448d1bc1288e0fdfb51a33eaf4ab54dc1902119c))
-  **PE**: Implement ProgramStatusPopup component and update program status handling ([6440a57](6440a5712a5db35b88d277f9468106152cfc2053))
-  **PE**: Optimize program retrieval by removing unnecessary sorting and adding orderBy clause ([637e120](637e120f88949e3cfe7f69fd1e28e75f58af43ef))

### 🐛 Bug Fixes

-  **PE**: The unused function was removed and prgState was set equal to the enum. ([5698c52](5698c524b236bcc7667eaf887c1503afc6fb217f))
-  **PE**: Update error notification message for no usable machine found ([8f50899](8f508991ea6cd3195043e551a9119e1a479a5477))
-  **MA**: Some tables not being updated during project upload process, closes #44 ([fcc7fef](fcc7fefa294fe8377724574c334707dcd9a9d077))
-  **MA**: Fix layout of command-type-definitions page ([29718e9](29718e9e9c4e12c999e0a3b55d21a630f7c0e12a))

### ♻️ Refactor

-  **PE**: Simplify ContextBar props by using v-model for drawer states ([5f22ff6](5f22ff64534b111d342ad0bc0650a311792bff9d))

## 0.65.0 - 2026-01-13

[Compare Changes](55190f45ad40ddafd3be701b20c4a71ae18e6cb6...9b6c5dd270b0fff2318d587fb8e9d590f4713f8a)

### 🚀 Features

-  **MA**: Implement machine lock reasons and notify users at start of project upload process ([5953df9](5953df9fca74eee795bfe1ca14825fa91452b85e))
-  **PB**: Add step working times feature with API integration and UI components ([6bc1bfb](6bc1bfbfa8a0350ddb5ae4cc3672b2fd0392cb7b))
-  **PE**: Enhance machine selection dialogs and update localization strings ([0192323](0192323aa57a6d54c8560f93f43344ebab0a35c0))
-  **PE**: Add machine selection props to TBPrintProgramDialog for enhanced functionality ([1d0dd47](1d0dd47e0e1378ea758c1be6bf37014fd1d83b3a))
-  **PE**: Enhance TBPrintProgramListDialog with additional props for machine selection ([2a2b8e7](2a2b8e7376253f216a309aea837cf67bb61c4a4d))

### 🐛 Bug Fixes

-  **MA**: MachineList not allowing de-selection of rows, prevent de-selection on dblclick ([a850661](a850661f13fb7e82df90d46f45423c2a23cb2b1d))
-  **MA**: Update completion messages for machine settings to improve clarity ([4757c2e](4757c2ea20387141dea3b0084128a2e1cc1977a4))
-  **MA**: Enhance logging for version retrieval with machine hostname ([7360e04](7360e041044f1cc9a1022cc16650b90e4d77ab34))
- **task-stream**: Prevent completion from aborting task signal ([de1d15e](de1d15e25af87393d7d3d3d965166028caa11979))
-  **MA**: Fixes related to machine update and sync process ([5de6939](5de69392de34f4b9b68983291e39fc2ebac11615))
-  **MA**: Remove server-side translations ([19db647](19db647757090ae1f46b8172428357aa201c0cc7))
- **task-stream**: Allow users to handle response errors via `onResponseError` option ([5149fe5](5149fe5aa3672410a72c9864bd4149d9bab92b22))
-  **PB**: Fixed auto add feature with API endpoints and UI integration ([74decd5](74decd5a02efc57300b0893a6dc44b82663422ff))
-  **PB**: Update font usage in printTable function to use Roboto-Bold and simplify PDF output ([cb6a1cb](cb6a1cbd75cad4c047df2c472215555e52ad0959))
-  **PB**: Update updateAutoAdd function to accept a boolean parameter and modify API call accordingly ([21415e0](21415e0871fb2d2d86d00164d23a8074ad74006e))
-  **PE**: Enhance machine selection functionality across dialogs ([0b6dd5e](0b6dd5ebe8f4ea8854febabcc51e9e045a62ef93))
-  **PE**: Standardize margin classes in dialog components ([8ae1b3b](8ae1b3b0995e7b9a11b0e864ad223e38ba4c9720))
-  **PE**: Update machine selector props in export dialog for improved functionality ([d5a4e20](d5a4e20de90cc36d74fd3555829668472a6499eb))
- **migrations**: Implement CASCADE on foreign keys for BFPROJECTMESSAGES and BFPROJECTTRANSLATIONS that references BFMACHINES ([36b0371](36b037189e38073c322f90a307fccc4f6e01bb67))
-  **MA**: Move machine update requests inside `AddEditModal` to prevent dialog from closing when request fails ([74bc891](74bc8915a54bac9ced26e93800d982722e6ce93b))
-  **MA**: Refactor refresh logic to update selected machine references ([0f7f0aa](0f7f0aa3a16abeaf84b27bbe02b6e1b6c259593d))

### 🎨 Styling

- NewIsCap exception for jsPDF constructors ([8d4c315](8d4c315c1e96f3ac13f463daeeca92b2cc6420db))

### 🔧 Miscellaneous Tasks

- Update lockfile, add `vite` as devDependency to root app to prevent peer dependency warnings ([eba59b6](eba59b609664bd3a534f12008e99098f8dc160ff))

## 0.64.0 - 2026-01-07

[Compare Changes](493522b8b2fae475aac3f343258705446cad31d0...55190f45ad40ddafd3be701b20c4a71ae18e6cb6)

### 🚀 Features

-  **MA**: Add home page link as a machines button at topbar ([ab9b428](ab9b428c9ee27574a7a5f6429f20c425652bd2d1))
- **task-stream**: Add copy logs functionality and update translations ([179cb2c](179cb2c57f56db9767708fcc28aedbd19b890460))

### 🐛 Bug Fixes

- **task-stream**: Conditionally add Authorization header based on token presence at `useTaskStream` ([02ba49e](02ba49e7173587295b2e200507ff78510baf6c9e))
-  **MA**: Improve layout of step-skipping-reason-commands page ([c6342c2](c6342c20511981911fde4ff69faa35b8ea81a5d9))
-  **MA**: Correct error message key for loading project translations ([2be102d](2be102d4a76f166c397a44b7c32cdc6150718e1c))

## 0.63.0 - 2026-01-07

[Compare Changes](04c6a4cb6ce16753e4bc7dde38c3f69310ebabb8...493522b8b2fae475aac3f343258705446cad31d0)

### 🚀 Features

-  **MA**: Refactor AddEditModal and MachineList components for improved functionality and UI ([b4bbf1d](b4bbf1d7ded23b0b15d2e3248d878ebb9430a90b))
-  **PE**: Implement machine and program existence checks with user notifications ([fa28d22](fa28d2231a14761addfb402454a239ce027d65f6))
- **nuxt-base**: Task stream related fixes/features ([81b7409](81b740943280e9ff96c3d17a09f853bfcb2da883))
-  **MA**: Use task stream while updating machine settings ([61a5ac4](61a5ac4015fbac01a3f3451433fc36e9072566f5))
-  **MA**: Update machine system settings has been converted from page to a dialog ([cd43bc9](cd43bc9c71c06f884f9048214699944b5dca751d))
-  **MA**: Title of the page added to QToolbar ([5b11aea](5b11aea935a94e7e916fc2971f0178fc754a5b7b))

### 🐛 Bug Fixes

- **root**: Remove invalid trailing command in `locales/en.json` ([f182902](f1829022a0bf0462dc96ee8e57a5f05864834454))
- **useLongOperation**: Incorrectly used ref object in string interpolation, remove type exports ([4feb172](4feb1725922317a722ddc900957b3dae6f1184a2))
-  **PE**: Replace console.error with logger for machine status check failures ([55c9b3b](55c9b3bd3129f4b87db7b56e6bfa720282ad5bfe))
-  **MA**: Prevent triple click on machine rows from closing dialog ([3b5c297](3b5c297f63416e60a584260d40433e30d99615b3))
-  **MA**: Smart-request-command-definitions page layout fix ([73838b2](73838b25328d4b4724f709e6df18700c3008e6fa))

### ♻️ Refactor

- **nuxt-base**: Rename `longOperation to `taskStream` and move it to a separate nuxt layer ([0a97a0e](0a97a0e4d91cc95f9d57731ed21e41a1f1bec693))
-  **PE**: Update program column structure and improve table header styling ([8d13c53](8d13c53e4e39744521daed0680c9a18985e23409))

### 🔧 Miscellaneous Tasks

- **nuxt-base**: Update quasar to version 2.18.6 ([0c1b0b5](0c1b0b50dc5a7a7d15e75a86a7e835daea17a350))
- Bump packageManager to pnpm@10.27.0 ([c57abfd](c57abfda641383d6d49ed69d5bbc3bfb6e6bcace))

## 0.62.0 - 2026-01-05

[Compare Changes](7ba56d6318ebfd8a149e0ca6078238602fb05957...04c6a4cb6ce16753e4bc7dde38c3f69310ebabb8)

### 🚀 Features

-  **PE**: Show program duration calculation errors via dialog, save duration of steps to database ([a3cb08e](a3cb08e42ffe76b495cf03693016907b2b77e9fc))
-  **PE**: Implement copy step dialog and enhance context menu functionality for step copying ([f5a4d3a](f5a4d3a04643e05e8fa64992033420e140da4906))
-  **MA**: Open MimicDialog on double click ([9d243f5](9d243f5fb392c0efa6e28c24f5dcff9e1ce83738))
-  **MA**: Dialogs stay persistent onChange ([f9039d9](f9039d97be7ef083be79443a5dddd0318127d9e7))
-  **MA**: Network connection check before project upload ([57cdcec](57cdcec4806e888f9b3209a192510a7039867b3e))
-  **MA**: Dialog prompt on leaving before saving changes ([e6b5797](e6b579731e49523f6810d68d60590a7f43f61dc4))
-  **MA**: UseUnsavedDialogGuard generalized to pages ([0142fb7](0142fb73a518a9ef5e1fb1cc5f5f84597ee1637b))
-  **MA**: UseUnsavedDialogGuard changes ([c64d2db](c64d2db29f9b8bb8fe4b3d502852d8796972aff4))
- **nuxt-base**: Implement LongOperationDialog and related utilities for handling long-running operations ([b830092](b8300924910e1f744173f98db0bbf9b3d96eef8b))
- **nuxt-base**: Implement SSE-based long-running task tracking and cancellation ([9ff35a4](9ff35a47e7e8b1395033912fd179e4895c1cc05e))
-  **MA**: Migrate to `longProcess` for SSE-tracked tasks ([bc4730e](bc4730ebab55344a2e6f324f6e3b1faf64ceefc7))

### 🐛 Bug Fixes

-  **MA**: Add T9 entries to tbb model options ([4ecfe61](4ecfe61fc61227772a740b43aebf028703589e65))
-  **PE**: Prevent execution of treatment parameters fetch when optimized settings are disabled ([5de5e56](5de5e564d6bc64476bc9716575fd931e721b79e4))
-  **PE**: Remove min-height styles for dense input field ([9800f2e](9800f2e91e96486a7e186c5fd01bc5403099d163))
- **quasar**: Rename `prevent-down-when-closed` prop to `disable-down-open-menu` to be more clear of its purpose ([724cf19](724cf1976c642e27097d1f516b54f480fa000167))
-  **PE**: Enhance options handling in `ProgramStepCommandParameterInput` for selectable formulas and improve dynamic width styling ([67aa794](67aa794f049e7977255c8fdf7cfd2fa7d8c7d529))
-  **PE**: Improve delete and navigation key handling in program editor ([f37f974](f37f9741f1afe06fe7ced00af6eb539f94ec3c27))
-  **PE**: Update scrollPage function to use stepId instead of stepIndex for improved navigation ([e19185f](e19185f14911c13a0252121d7dffe35a9e1edd7b))
-  **PE**: Remove unused handleFocus function to clean up code ([aac681c](aac681c6fb310048b5f4b91a7580bf252799defb))
-  **PE**: Update step selection logic to use stepId instead of stepIndex for improved clarity ([da54f10](da54f10e5b8f76965b00991d9045ddca7ee3fae0))
-  **PE**: Refactor getStepIndex function ([8fa464a](8fa464a504e17bde5d4625aa6c1a97c207d7e482))
-  **PE**: Update stepId usage across components for improved consistency and clarity ([4f43cef](4f43cef86b57907c424fcd7da5f1c0264825bb66))
-  **PE**: Clone copied step values to prevent mutation and improve data integrity ([2a9b334](2a9b334df90c6c9814a7c603680e91b25ee237f8))
-  **PE**: Add handleFocus function to select step on focus and improve user interaction ([c94d9ca](c94d9ca578c666a08b3e8c52d24442bfd5e62c4a))
-  **PE**: Adjust newParallelStep function to select the last step for parallel commands ([aa4c953](aa4c9532c699134758f62fd608e2affa5ceabe19))
-  **MA**: Default steamUnitOption moved to Kg ([38e9b57](38e9b5750a580265c6ddb87e44ced1c1a9f70050))
-  **MA**: Double click behaviour ([ca78d7c](ca78d7c694817db0f168592cfc94d3b8fe270f2b))
-  **MA**: Emitted event name ([e1669f3](e1669f3ba2309ac3401eb35d3d3950ad107e66a2))
-  **PE**: Disable machines with no commands (TW-171) ([9c85a93](9c85a9346eba4ee811c76544c711a33361a82c89))

### ♻️ Refactor

-  **PE**: `getPathElement` accepts path objects instead of strings ([4b39107](4b39107d340fc4e8724e835c05307e98956d55a6))

### 🎨 Styling

- **eslint**: Disable ts/method-signature-style rule in ESLint config ([9dd3509](9dd35093a6850e50dcf5631a096effea5164233a))

### 🔧 Miscellaneous Tasks

-  **MA**: Localization ([b7a44ce](b7a44ce74df235f4d39d3d151b2935d0c6435b30))
-  **MA**: Removed unnecessary variable declaration ([6581076](658107634c84a629d49fec705ed8d5df4f706cd1))
- **nuxt-base**: Enable server-side translations ([ab5333a](ab5333ad4c62a0991fb680881bd5331ffa5e8cb0))
- Update lockfile ([627edc3](627edc3d781c6c165c287f876b3ad36076ff5b91))

## 0.61.0 - 2025-12-18

[Compare Changes](d04c0bd47f7609d19446a4207abac8a2e53ce5f7...7ba56d6318ebfd8a149e0ca6078238602fb05957)

### 🚀 Features

- **mcp**: Add tool to fetch notes for a specific merge request by IID ([4b8d412](4b8d412358046ea62267a1602c363a0bd293499b))
- **recipes**: Batch no type changed to alphanumerical ([a8663f3](a8663f39f16c611c1e57f3d99613e221cefd8e69))
- **recipes**: Transactions added to recipe and job order create endpoints ([b03c233](b03c2338a67f4554f5768f6f1103e4ab30801944))
- **recipes**: Optional fields added to jobOrderPrefs ([a79a265](a79a265d19bbf450688078a66b96c560988e020c))
- **recipes**: IsManual teleskop sync added ([32fd103](32fd1034296e62bc442737073f43e360a4efa66e))
- **recipes**: Manual material steps added ([d0d1a71](d0d1a71278d251603a015f4169ecae6685bd512a))
- **recipes**: Manual material DMExchange changes ([e1778de](e1778de571d021635cde44cf409d62b556463fd7))
- **recipes**: Manual material implementation cont ([0ad2270](0ad2270d5bb6f0a787368a6d51eb810f18706862))
- **recipes**: Filter JobOrderList columns based on jobOrderPrefs ([01630d8](01630d87a6b316f94a53d516c32deb5da02ab67f))
- **recipes**: JobOrderList column filter based on jobOrderPrefs ([797cfa7](797cfa79b8a2d28481b92bfd988e16d9fec7bd82))
- **recipes**: Dispensers removed from SideMenu and main page ([2917b8a](2917b8a5a951c130d9d26d8809797495fda1bb97))
- **recipes**: Date filter for JobOrderList ([713288b](713288b8d63f91bde7a28366b940565bd9aefc5b))
- **recipes**: Program display on JobOrderList ([a0e6de4](a0e6de471dd94258fa9af4f28f6b342b6217e56c))
- **recipes**: Recipe added to job order records ([3605059](3605059d70a5818c2d64954b019020fc782d8e69))
- **recipes**: Batch no update logic change ([0f16eb3](0f16eb3016e835a04a8faab3cdc5ca7410eef001))
- **recipes**: Reuse request from previous JobOrder ([dd7ec83](dd7ec83da39f8cad7e99c0f0e41c7b28d2194d38))
-  **MA**: Add warning for theorical charge duration exceeding 1440 minutes and update translations ([65a8fc2](65a8fc2acbe14aee38adecf23c334a3d9160b91e))
-  **MA**: Update permission labels and enhance dialog layout ([970a1f7](970a1f73f18eb2303ebe4f28daff1552f6caa8bc))
-  **MA**: Update user permissions dialog to require full User object and add select all functionality ([1330468](1330468e91780b47518804c4a832626e4acf9cbb))
-  **MA**: Implement user management API with GET, PUT, and DELETE methods ([7119c94](7119c94a5e424c72117fd79b2211c27e8c4df4ed))
-  **MA**: Add UserEditDialog component for user management with form validation ([f2bb547](f2bb54709b2ad3060afbb81b80a81b74990a8879))
-  **MA**: Integrate UserPermissionsDialog and update permissions handling in UserEditDialog ([77901ba](77901baa5665693c075f82120c85f053d8c6ec7e))
-  **MA**: Add ConfirmDialog component for user deletion confirmation in user-definitions page ([7d8d0be](7d8d0be96bbdbd256e050c35ec26bb4c2d349077))
-  **MA**: Pass userTypeOptions prop to UserEditDialog in user-definitions page ([3da1a63](3da1a63114f815afd95df5582df0bf5f116c404f))
-  **MA**: Enhance user edit dialog with internationalization for labels and error messages ([fd23b9d](fd23b9da443ce3fa15635e42c6586bab1c3b289f))
-  **MA**: Include userId in the update operation for user details ([07c8220](07c822018b4fee3b7343f7186cd1dd3d6ab55828))
-  **MA**: Update title in user definitions page to 'controllerOperators' ([ed84d4b](ed84d4ba09ef7ba589c12b0342d45f1093cbce83))
-  **MA**: Add new permission for automatic measurement commands approval ([f48432b](f48432b7d1d5327a5f1496eef0c587d5a731733f))
-  **MA**: Implement bulk user deletion API endpoint ([1cd68c3](1cd68c3a1793ee32fff4574d54c6bea75c25199e))
-  **MA**: Add user update validation schema and improve PUT endpoint handling ([838330d](838330da9598d91b277146a29db87600cc133eb4))
-  **MA**: Enhance user password validation with length requirements and update localization ([2582955](2582955aea4c16bacd2cb318e2086e35d0045ffe))
-  **PE**: Print program improvements ([2baa0de](2baa0ded8b30214ecc72fcc7ebc2239a59eb6f68))
-  **MM**: Enhance consumption tooltip with last and this week data ([1d23e09](1d23e0941ba970c545f7a8af6b940ed4fa4aaf71))
-  **MM**: Add date range properties to trends and update related components ([77fe07f](77fe07f10ab04074f767b30744eed8c3383d0b57))

### 🐛 Bug Fixes

-  **PE**: Save as program and update endpoint ([ec7bfc4](ec7bfc48bbaf6e5a5647e560014e31606c2c85e8))
- **mcp**: Normalize file path handling in add-merge-request-note-for-code-range tool ([ea835dd](ea835dd4b532641d065198ffe76d0d2740bb3be4))
- **recipes**: Prev commit ([0ccab65](0ccab658b1d29d155c889173c48c23938811faf1))
- **recipes**: PROGRAM_TEMPLATE cascade delete added ([78492d6](78492d683c89499da48b1e47a341180dcc25f17c))
- **recipes**: MATERIAL_REQUEST step_no entry ([1febab2](1febab24d67cbcd67854e60dcfcd0d7c02a12a90))
- **recipes**: JobOrderOverview time and optional fields display ([892e7f4](892e7f420d1dfc0be6ab104c54635adee2479fbe))
-  **MA**: Ensure boolean fields default to false in form submission ([f6ac653](f6ac653e26e4cdff4fc9421f21b46e633f373a36))
-  **MA**: Ensure row selection emits event correctly on row click ([ef29061](ef29061786e60e683c000c0f2a1a1b554c5f552f))
-  **MA**: Update userId label and add validation messages in English and Turkish locales ([fcf2106](fcf21062d342b3993524b6f4a4da74307d4ab450))
-  **MA**: Change userActive type from number to boolean for accurate user status representation ([b2ed174](b2ed1743accd4cee6962b43c42ce055ba2c59d2c))
-  **MA**: Override default validation messages for formkits `min` and `max` ([5047352](5047352e65e476ad4c50cc86a8b75e7e99705f77))
-  **MA**: Multiple machine add/edit form fixes ([6bde3c2](6bde3c24d5c721097a5919047edf6ceb30c1a56f))
-  **MA**: Update API endpoint for user definitions ([d5c76fd](d5c76fdf79a0fa77bb8d6a3fb1e8e777e8eae98a))
-  **MA**: Improve error handling in user creation and fetching logic ([9a7c22f](9a7c22fa6e7ad4cbe476d45a16a9ffd5a487c85b))
-  **MA**: Consolidate bulk delete functionality into user definitions endpoint and improve error handling ([3560ac1](3560ac19872e0e96fdef74ec0c9baa71d9466c96))
-  **MA**: Enforce integer validation for userId in userUpdateSchema ([3186243](3186243248c6923cd32ad7d9c7fc0d893e3ed8c1))
-  **MA**: Use `defineModel` in `ConfirmDialog` and `UserPermissionsDialog` ([d1b9fd4](d1b9fd46d0430a6a4c491b00027cc6d9cecf78ec))
-  **MA**: Refactor IP and machine ID duplicate validation logic in AddEditModal ([c4d3449](c4d3449c0c53f6a73a5a64b4fcc911587f2f95bb))
-  **PE**: Update API endpoint for bulk program deletion ([509d764](509d764127a296a8c410d79e1f9133b787ef0895))
-  **PE**: Refactor program comparison functions and renamed ([e19bb16](e19bb166b70f53041c4631c893afe6f20eb66378))
-  **PE**: Machine selection logic ([3b59cbe](3b59cbefe7d586145c0e9ed18891f985d65d29bb))
-  **PE**: Update MachineList component to use props for machine groups ([8f7e1f0](8f7e1f0b417d40303a848dd0082bd9265fec3c14))
-  **PE**: Remove unused functions ([34287b5](34287b52d9587443199fb1a65d768296ffd06d8a))
-  **PE**: Simplify error handling logic in useErrorStore ([200dfd0](200dfd0407c74abd8434e5bda7669b3c5c4ac092))
-  **PE**: Update unsavedChanges command to use targetRoute instead of machineId ([91e657e](91e657e0a7ca32196e781bded90ae06f01e5fdb0))
-  **PE**: Simplify unsaved changes dialog ([897d267](897d267f28981ffae90779247bbacb978002440b))
-  **PE**: Rename variable ([4ebbe20](4ebbe201bd03531177ac1387728cbb63ca0aa92b))
-  **PE**: Reset program when machine changes ([6832c2c](6832c2c414689ec216a3ea1dc6f3753f141ede73))
-  **PE**: Refactor route handling for machine selection and unsaved changes logic ([ce3983d](ce3983d4a98a1469cc89dbb5b43a5f825a5ea813))
-  **PE**: Streamline error handling in program download process ([0c05cc0](0c05cc0052e335e0b6a93950ac95ea47ad43ae99))
-  **PE**: Remove unsaved changes command and streamline route leave handling ([17daf54](17daf54a8b8e316d3d6d95c97bdb6cba24cae114))
-  **PE**: Improve context bar button visibility and layout ([5275fd9](5275fd981027532a711f65430a23c553c0a85a63))
-  **MM**: Correct interface name and add hasVNC property to machine status ([db1a6d8](db1a6d86766795c78fc4373a5922cf7375ad0105))
-  **MM**: Update connection status handling and improve UI feedback for machine commands ([e314073](e3140736bb0d9c512c2e061f9ee5217fdfec6da5))
-  **MM**: Update date formatting logic based on locale and clean up machine status display ([b89d80d](b89d80db017663ca67cc27ee8fad3e76b1c72683))
-  **MM**: Update loggedInOperatorName fallback to empty string and add hasVNC property to MachineData ([af6df3f](af6df3f7be57cf5dead99e1f793f7e1068c19fe2))
-  **MM**: Adjust layout properties for better responsiveness in settings component ([d487966](d487966552bf8f15991f2a41ced396bc2e511038))
-  **MM**: Update default settings button label to use translation function ([5fb0c24](5fb0c24d95a36d7bdcf33f483be327f1dfe54582))

### 📖 Documentation

- Add initial repository details and structure information for copilot ([cc297fc](cc297fc240acebd9cc3ff2e6d4bda15beaca6327))
- **agents**: Clarify schema change guidelines for migration-service and recipes app ([e42d331](e42d331b8d841a89039fae763c3df63af2129865))
- **agents**: Enhance review guidelines for Merge Request Reviewer Agent ([30d64ae](30d64aece25efd26039c2241b7f9c183db251d62))

### ♻️ Refactor

- **mcp**: Bump mcp sdk to latest version and update mcp server code accordingly ([0240a5d](0240a5d1ec576dbbb9587a04c383eb59e4deb761))
-  **MA**: Streamline user management component and enhance user interface ([255430c](255430ccffa636ddb7ffb0b1a35d59a547c575ea))
-  **MA**: Update UserPermissionsDialog to improve permission handling and user data management ([fc764c9](fc764c943b40f9f02b876f02695cbda6d3443787))
-  **MA**: Remove unused userDeleted badge template from user-definitions page ([5c37803](5c37803b5e79b163a878cc484191f4e9c7f616ca))
-  **MA**: Use `defineModel` in `UserEditDialog` instead of reinventing the wheel ([4cadf78](4cadf78ff362bdc1546fd7fc1a1e30403ede266d))
-  **MA**: Rename User interface to UserForm ([ae7fe4a](ae7fe4a95e56542d74ffcedabd4a8df640aa1328))
-  **MM**: Replace magic numbers with enums for alarm and machine statuses ([1fcac1b](1fcac1bfdb34978925cce2da474efd56f0c7125c))
-  **MM**: Simplify date formatting logic by using useI18n and removing locale-based formatter ([2a47c09](2a47c0928fe52d4f5bff44c8774521595ab73f4c))

### 🔧 Miscellaneous Tasks

- Bump `zod` to version 3.25.76 ([4de4814](4de4814f0a2896d03ac22720cdb99dd849f12af3))
- Add MCP server for GitLab Merge Request operations ([a50b9fb](a50b9fb6ca466475a51991e62ddffd70ee57c790))
- Add Merge Request Reviewer Agent with guidelines and toolset for GitLab reviews ([64e22c0](64e22c011abb1e1a297eebe4f1ab722691d2d098))
- Add gitlab-merge-request configuration to mcp.json ([73ddff7](73ddff7ff911cd4c97091bbb5d2ffd70bf3a113a))
- **mcp**: Gitlab-mr mcp fixes and enhancements ([24a97de](24a97deca7a61ba685c6cfb3271ac490b77ae5b7))
- **mcp**: Minor formatting change to ai footer ([af559e1](af559e142d7b2ccdd67f43e50a24101bed16a11b))
- **mcp**: Rename `gitlab-mr` to `gitlab-merge-requests`, support `--env-file` argument to pass env file to load ([7881bb4](7881bb401b26469b06c44751e3899691b621bb3f))
- **recipes**: Batch_no_seq and its post endpoint removed ([70ba71a](70ba71a0bfc73e7aea5ab3aaf74fbfc9b9673253))
- **recipes**: Dyelot_Parameter INSERT moved to single transaction ([65eaa11](65eaa119447f06c435c43e667c26830709cd8ace))
- Update lockfile ([fe40a12](fe40a120e24e283d7865832b320e809a83276f61))
-  **MA**: Standardize error messages and status codes across API endpoints ([d3adafe](d3adafe2d2c0d98446363f345525e8d121b528de))
- Move `.npmrc` settings to `pnpm-workspace.yaml` ([b7ccb22](b7ccb22f5b1242aa48839d1e26dd06473d3c3ac2))

## 0.60.0 - 2025-12-08

[Compare Changes](3cb79bd1242ae2c5d2f1478c18f46aac4972dca7...d04c0bd47f7609d19446a4207abac8a2e53ce5f7)

### 🚀 Features

-  **PE**: Delete programs in bulk with its own report dialog and endpoint ([b79c535](b79c535f4cc3d7c5dd3fff422c32a7b966dbe518))
-  **PE**: Search commands used in programs via parameter and io filters ([8838e7b](8838e7bda5db8a69c448ac7d6134b31a38f051ba))

### 🐛 Bug Fixes

- **migrations**: Add migration to alter PARAMSTRING size in BACOMMANDPARAMETERS table to make it consistent with BFCOMMANDPARAMETERS ([2a9cd1f](2a9cd1f92988aa96a362beff06b65061c145e666))
-  **MA**: Remove redundant columns from MachineList, make table header sticky and action buttons stay on top ([8f7bb32](8f7bb32c374d6e9a54f9d01d5c38f3d795c20046))
-  **MS**: Fetch running fabric weight more accurately ([31be83f](31be83f5b62e2c28b659e2979623b6d5bfc4e78e))
- Remove `runningMachineCapacity` field from machine status interfaces ([24c60cc](24c60cc51d17b8240357d889b222d82310727b4a))
-  **MA**: Missing icons it command types page ([b9987df](b9987df5323dd97d817d7ffc101442b834fb5854))
-  **PE**: Improve navigation between program steps, disable de-selecting via `Escape` key ([4d12ca3](4d12ca37b8768499750862d81301666500ce5d69))

### 🔧 Miscellaneous Tasks

- Update lockfile ([46fea1f](46fea1f462d37a3167ec363e0de1c3a3dd9409d7))
- Update package manager version to pnpm@10.24.0 ([38453f9](38453f9d4276388cc17fa8c7a75844d7c494c586))

## 0.59.0 - 2025-12-03

[Compare Changes](2bb10545b950902e0041a063b8d84b65d2ef07a8...3cb79bd1242ae2c5d2f1478c18f46aac4972dca7)

### 🚀 Features

-  **PE**: Update fetchAllPrograms to accept machineId and add refreshAllPrograms function ([b98c189](b98c189475b2328b857ffe358bec5a08e0ff9835))
-  **PE**: Enhance PDF generation with machine selection and detailed program info ([8bd68b5](8bd68b5fa2d5c9a0ff49a2bb4df28864a1659d7c))
-  **PE**: Update print commands to use machine name from editor store ([7081109](7081109b95161b72fc88dd4fe52a92ac07745769))
-  **PE**: Update print program list dialog and enable print commands in menu ([4f6bb0b](4f6bb0b4927b60f65a73ada62ef8d2a2a92b9174))
-  **PE**: Add jspdf and jspdf-autotable dependencies ([8447c1c](8447c1cde1d0123798e5b80abf322fc4eafe4239))
-  **PE**: Add print label to English and Turkish locale files ([b43ca5d](b43ca5d02f4d16ba29a1888a49e1d8bd63971728))
-  **PE**: Refactor PDF generation and enhance print/download functionality ([4a367ca](4a367ca74cada3bb939cf103201e7150589e9c50))
-  **PE**: Implement single selection mode for machine selection dialog ([07a9e79](07a9e7950608c35c3ec0cd512725117fa73a5f22))
-  **PE**: Enforce single selection mode in machine selection dialog ([78d1665](78d166511f1ad1fb4006f333c224da30ade8e7e7))
-  **PE**: Implement loadMachine function for improved machine data loading ([b33b526](b33b5266a930cc5babe2b36692a55720407d63e7))
-  **PE**: Enhance TBPrintProgramDialog with machine and program selection functionality ([9343089](9343089223783c778b07965531ac132c79a3dcc2))
-  **PE**: Enhance PDF generation with detailed machine information and pagination ([000d5ac](000d5acc161ead0c7ee35cbe41209172ff8117db))
-  **PE**: Add dialog hide event handler to TBPrint and CMMachineList dialogs ([f797079](f7970795ac9c576fd89b14eb2ce8ba9a72b63894))
-  **PE**: Pass program and command lists to TBPrintProgramDialog component ([6f6bb19](6f6bb19119e021bebd3b2731b1592f7048d3d3bf))
-  **PE**: Add current machine ID to CMMachineListDialog and enhance machine selection localization ([4cde7ae](4cde7ae3504c9a3887324b49e2fff57b976c6e39))
-  **PE**: Update print program dialog title and enhance localization for print program functionality ([e29d73e](e29d73e29cb0720c570e1e2a140accd9d81459db))
-  **PE**: Refactor TBExportExcelDialog to simplify machine selection and enhance export functionality ([98fa094](98fa09466331c15a38aac5475f3b145124e683cf))
-  **PE**: Update machine option terminology in print program dialogs for consistency ([60e6dd9](60e6dd9cb3d7c484aa6b526d39203f5b7c0181bb))
-  **PE**: Update exportToExcel command to use machine name from editor store ([93e3fdb](93e3fdb5f28941107e0d6aab96d8a4620d706bea))
-  **PE**: Implement CMMachineSelector component for improved machine selection in dialogs ([e372964](e37296452f838b9837b0515a3a30af961163cbda))
-  **PE**: Enhance CMMachineSelector with single selection support and update localization for machine selection ([df71d27](df71d27fdba75b70f20b5817df1f53498931ad95))
-  **PE**: Implement PDF generation worker and enhance print/download functionality in TBPrintProgramDialog ([aec402e](aec402ef6df258c2e0aa9bf22fc5213ffb43d63a))
-  **PE**: Refactor fetchProgram function to return program data and add loadProgram function for data loading ([0f1d8b1](0f1d8b12f6b3b2ea12e1bf9e3a65c49353843795))
-  **PE**: Add functionality to insert a step between ([d9e7caa](d9e7caadad6f33df785f533105af8947fd43ccf3))

### 🐛 Bug Fixes

-  **PB**: Refactor bulkUpsertPlanParameters to delete old parameters and insert new ones in a single transaction ([854d34a](854d34a7bf3081d3e7cb5cf580bba42317c0608c))
-  **PB**: Send all parameters when submitting plan parameters instead of only modified ones, remove parallelism during transations ([22adcda](22adcda38b5ab9c3b4a77bfbecafd2e79129f29c))
- **recipes**: Dyelot tables cleanup on override ([cb4d24e](cb4d24efecd46f2d27fbf788da496f6c6e3663d2))
- **recipes**: Materials isManual display ([993e03f](993e03fb8d6e776c8d1392c3a2a558460197cb0e))
-  **PB**: Remove manual event type and related logic, update interfaces and components ([aa39fe2](aa39fe240ee07b87f317106cd65f6b9ec2390142))
-  **PB**: Fixed an issue where events with no joborder's couldn't be scheduled ([a52a021](a52a02128a5ad96fff33926693bb61f341822b2c))
-  **PE**: Clear error IDs on route leave to prevent stale error states ([b2553e4](b2553e412a19247035007f8d0d8e87e25338435f))
-  **PE**: Remove file extension from exported Excel file name in exportExcel function ([352b487](352b487bbd66d94cdf47faea2a5d6a3791a436c9))
-  **PE**: Add deep copy for programs and commandList in generatePDF function to handle Vue reactivity issues ([2ee8a52](2ee8a5239c8c3efc9e906d5d0c78ddc36ab58abc))
-  **PE**: Use `es` format to build workers ([6263f52](6263f52bb626f56653828b14b0e377ef3dba6fcf))
- **tbb-ftp-client**: Refactor almost all parsers and make them more robus ([77c3e7d](77c3e7da036dfaf967c11d236526630acb5688b7))
-  **PE**: Add onDialogHide handler ([69dc9ac](69dc9ac87ce9744b06c68ac1c24ba2e37fd1d904))
-  **PE**: Add MachineOption type for current and selected options ([d6e3819](d6e38195214a49cd6272a7139d630b5e110dfb1e))
-  **PE**: Update worker URL to use .ts extension for PDF generator ([9511749](9511749f7304e7e27303b89671ce698d4a44561a))
-  **PE**: Remove `isNewVersion` toggle button from toolbar ([29b9325](29b9325b0463af08812a4ca022b03925a25addbd))
-  **PE**: Update openMachineInNewTab to use withBase for correct URL handling ([b8425bd](b8425bd6487840ba7d2e7229642f43bffdd40bfd))
-  **PE**: Add goRoot computed property to properly handle root navigation logic ([b34f1aa](b34f1aa518efa4ea3b9343493b9e74e96d88bee8))

### ♻️ Refactor

-  **PE**: Remove CMChangeNameDialog component ([87be1a8](87be1a8166554c500a29f88ee62c6df3b713ca19))
-  **PE**: Simplify date formatting in formatDate function ([d7e731d](d7e731d78edcfba49729f7f88f4ecb55e79f84f3))
-  **PE**: Add onDialogHide handler ([88602e3](88602e32dce895854b9deb304e5f4532745edc05))
-  **PE**: Add variations of addStep and make its parameters mandatory for clarity ([324a26c](324a26c0d65d2b9aa0d1b8b8a5424a373d038f21))

### 🔧 Miscellaneous Tasks

- Update lockfile ([fa1d3d9](fa1d3d97c16b024fe3e124d56de8d8f769b85140))
- Add support for JSONC parsing in environment generation ([0410b1b](0410b1b1b2d4242d2712dc0ef771c508d211e1f9))

## 0.58.0 - 2025-11-26

[Compare Changes](0de2c984262eecd04c1ec046808edb915b785c42...2bb10545b950902e0041a063b8d84b65d2ef07a8)

### 🚀 Features

- **recipes**: JobOrderOverview access from JorOrderList added ([ccade4c](ccade4cb678f780dd8be5fac45d1d1917fb29720))
- **recipe**: MaterialCode change and encoding added ([4c2cb16](4c2cb169be83b7913af90146eb9cb5a35de781c3))
-  **PT**: Add bulk creation of plan parameters with API integration ([0801dbc](0801dbc2835130cb6a2e2be4e190ba4c1ef0bb9c))
- Added mcp server for sql server ([d4891d0](d4891d0f3a2eef3b428dfd51a97ba2b0a979a6ec))
- **core**: Add static method to create TonelloApi from hostname ([6ac216e](6ac216e6a38e91b03b401735c94a53d8c5f4b2d8))
-  **PT**: Handle sending batches to tonello machines ([1528af3](1528af377ae3c8b582b6afb5a581ad3633dbf0ea))
-  **MA**: Add mock weight batch parameter for tonello machines ([b605394](b6053947f948154474ff8131dc283f9bb1e512b0))
-  **PB**: Enhance parameter handling and add fabric weight support for Tonello machines ([3385da1](3385da1390e6e394e55fb5cdd37dc055a7f160fa))
- **recipes**: JobOrderPrefs added ([10cd1d0](10cd1d0b70dddc4b62d98b30a5f196563d4bdbb9))

### 🐛 Bug Fixes

- **iovalues-server**: Datetime values returned by tedious should be converted to ISO format ([636db11](636db117674cdb769a44b84596ccdfb9a94c3811))
-  **MM**: I18n locale having multiple setters ([13826cb](13826cb0f1bc7b869c2c956c5d167a0e37614186))
-  **PB**: Prevent casting of non-int parameter values at getFormula, refactor ([0170c1f](0170c1f6e90e18340209583f5747c1a9c4886587))
- **recipe**: Program template order no update ([c3ac174](c3ac1744f7158ad2249385bf33a23623d7f400b4))
- **recipes**: Wrong recipe Id sent on recipe creation ([56d6e36](56d6e3616ffc3a3c3a8da29604af83a8c9e893c8))
-  **PT**: Update condition for manual event icon display ([51bae23](51bae23e676dca2a168a2b75ad7228d89686f7a3))
-  **PT**: Add uploadToMachine call after parameter validation ([976f32e](976f32e0e41f0fdd4d210334fbd3bfc2af50524d))
-  **PT**: Added forgotten ongoing event type ([c176ba6](c176ba60ba869743ed021b32e88b05295259d710))
-  **PT**: Improve bulkCreatePlanParameter to handle job order and batch parameters correctly ([223a481](223a481388acd2d22a58ee2fae498152e7dcc447))
-  **PT**: Correct table name in bulkCreatePlanParameter for job order retrieval ([43cb935](43cb935839415707e65b0d7adf54e506dba2ebad))
-  **PB**: Move server host and port configs to config.ts ([ef2541f](ef2541f13f7a02adf97bdd1edc004a8334219269))
-  **PB**: Ensure uniqueness in fetchPrograms ([f908893](f90889318b5d1ef4b90163b8158586ed1e22e5c4))
-  **PB**: Sort programs before upload ([2614ef3](2614ef366377a12bde5958704213301081c2e7af))
-  **PB**: Update checkMachineParameterRequest to correctly handle missing parameters ([d138854](d138854fe6f4014c7e7b7a620d06f17ac684b881))
-  **PB**: Correct spelling of "occurred" in error messages ([12a99f5](12a99f52be5bb2613c23a84fd6518547c83278d0))
-  **PB**: Correct column names in fetchPrograms query ([3b90dcd](3b90dcdd3daf093aadc4d89250cb05a017bb111f))
-  **MA**: Update default value for mock batch parameters for tonello machines to -9999 ([adc367e](adc367e3c4f19b850207d09678a9a48f2ef18fe5))
-  **PB**: Incorrect logic while checking if given starting parameters are correct ([826e9ff](826e9ff4c1c86f0824ba2274f72e239ee7f26c32))
-  **PB**: Multiple fixes related to schedule/upload process ([4616a0e](4616a0e0429436745c0492ae97c219e7094a87ce))
-  **PB**: Upload job order to machine after an unplanned event is scheduled ([c75cccf](c75cccf6a27e678da530ffa9eccfb4c956d407e8))
-  **PB**: Return only incorrect parameters when trying to schedule or upload joborder as intended ([e82b27b](e82b27b90be53dd74f6093c6c39e1f5220357f3f))
-  **PB**: Accidently deleted queueUnplannedEvent call at fc2605ae when scheduling job orders ([a2d04d1](a2d04d1de93622246d6aca2463849bdd80555418))
-  **PB**: Use leftJoin when matching parameter types since some parameters may not have its type defined ([4e348cc](4e348ccad768dcd5d79564e451fee7636f3243d7))
-  **PB**: Duplicate plan parameters on PlanParametersTable and fix success message typo in localization files ([fe16550](fe16550b8cd620f78f3ed9a97593600364f2aa8b))
-  **PB**: Correct typo in upload success message in localization files ([ae4af04](ae4af04146ac1b98da8dfb0c6594868ae4ebadec))
- **recipes**: Localization ([199c002](199c002388a3bed240d4cc690e3dfbf31c5bcac7))
- **recipes**: Placeholder value removed ([5a3d813](5a3d813fb5fa2bc5443ead54f91b201de92f2485))
-  **PB**: Inconsistent disable condition for plan parameter submit button ([33c488f](33c488f5f1ab20263a97fb28f0d3dac9a1e46641))
-  **PE**: Added label name for contextBar buttons ([3096790](30967901d63fa1257fd4ceccee77572daf1bf6e0))
-  **PE**: Add error handling for formula parsing and improve logging ([6d22901](6d22901df4ef80b03408876b71c543a1dc6e3799))
-  **PE**: Update variable regex to allow specific characters ([6b56578](6b56578bb74dbd3a2d3cfd4bd893a3f1872d8229))

### 📖 Documentation

- Add MCP server configuration details for SQL Server and Nuxt ([5d21a2f](5d21a2fbbecaacb6060a41b4576d46bdd638e7f5))

### ♻️ Refactor

-  **PT**: Streamline event status calculation and update logic ([7883bdb](7883bdb923e3a17b042bee468f51a82555a38ee5))
-  **PB**: Improve machine info handling and add Tonello support ([0d2a3cc](0d2a3cce0a4c162240706f20279f0187194c7453))
-  **PB**: Upload and scheduling process ([57ec1df](57ec1df10582969408efddd04df82559930f017c))

### 🔧 Miscellaneous Tasks

- Add support for hotfix tagging in CI/CD pipeline ([6d96b2f](6d96b2f8e2224afee5f1637779a676bdcfdfb3d2))
- Remove empty README.md file from apps directory ([de32d79](de32d791d856f5743e3dec729fd6d79743c6a171))
- Add script to build and package apps into a tarball ([efac44d](efac44d694346fc9aefbbf0ea3664c474290972a))
- Add mcp.json and extensions.json for multiple apps with shared configurations ([125b577](125b5770bf0993e2718883da79aeb813ba5cd016))
- Add support for reading and updating mcp.json with database environment variables via generate-env ([e9667e1](e9667e1ac830149f15df3e9b1423871a5e0a62ab))
- **build-tarball**: Allow specifying apps to include in the tarball via command line arguments ([263bdea](263bdea386668d5c19fbacac548e7ac0e8b4890e))
- **recipes**: V-deep replaced with deep ([3412ddd](3412dddd4e9eab9e25464eb495df3e6c0e20f9ca))
- **git-cliff**: Ignore hotfix tags in changelog configuration ([604d490](604d490a86fd70681929e22d27173ca37e89fed0))

## 0.57.0 - 2025-11-19

[Compare Changes](b78cbc536bf0cb25e84cb5c6bdadbbc8ee912c89...0de2c984262eecd04c1ec046808edb915b785c42)

### 🚀 Features

-  **PE**: Copy programs and send to multiple machines ([cdaa394](cdaa394626be08b324982877e73f047b993bcf7f))
-  **PE**: Allow user to accept/deny all overwrite prompts when copying multiple programs to another machine ([897799a](897799a98f0f5b3e97f6e267d49c908cc6dc1106))
-  **PE**: When parallel step parameter is edited, ask user if they want to modify following parallel steps with same command no ([bb969d9](bb969d9a649c3af65e495884664b5ea8a83c716b))

### 🐛 Bug Fixes

-  **PE**: Comment out unused context menu options and toggle in settings dialog ([0110229](0110229bb75a7ad2de30d95cb24a60dfb4d2ed69))
-  **PE**: Update IO index and ID retrieval in command processing ([7422c30](7422c3087d4f3011697be05a6aa534652416e5cb))
-  **PE**: Destructure program data fetching ([b1151bc](b1151bcf3d172a431a4e6c2a5aaef9bbe40c22c0))
-  **PE**: Localization fixes ([0db8cb2](0db8cb2fa56ccb5a7e217c6d241a1e77fa133405))
-  **PE**: Program comparison not working when triggered from program context menu ([39cfa8c](39cfa8cc813e3821eea5f3c8f3cc12007b2a59b4))

## 0.56.0 - 2025-11-07

[Compare Changes](9130f1c1a637341f01506a516b25e5b975bc1c25...b78cbc536bf0cb25e84cb5c6bdadbbc8ee912c89)

### 🚀 Features

-  **PE**: Add full screen option for step/command graph in English and Turkish translations ([a2a54c2](a2a54c26b5c68a1900cdb89a29a9fd7e4cb4b5ab))

### 🐛 Bug Fixes

-  **PT**: Improve row number calculation for actual events by handling null plan keys ([eb418df](eb418df058993945662d1505892331761d806477))
-  **PE**: Reorder parameters and update return type for calculateProgramDurationPoint function ([8cee825](8cee825232f768040546b32f5ac2d8c4576db0d6))
-  **PE**: Update command execution to include machine and program parameters for tempTimeGraph and stepCommandGraph ([f2a9413](f2a941384c03fe8fcf6d5238d9a1684e94385b42))
-  **PE**: Update screenshot filename format in takeScreenshot function for consistency ([e9107dc](e9107dc912e5c15eb486dcbf67cb1814fbb60c18))

### ♻️ Refactor

-  **PE**: Update props usage and improve chart data handling ([3316810](3316810966cb3b322425e969075b85d4e83d1a88))
-  **PE**: Remove getMachineStatus method and use machineStatusStore for status checks ([bcaf260](bcaf26054feb5ff6286bac1286efbf233b404ecd))

## 0.55.1 - 2025-11-06

[Compare Changes](50e7de34e4aa10ffb75e4d2981ae75b96c776e9e...9130f1c1a637341f01506a516b25e5b975bc1c25)

### 🐛 Bug Fixes

-  **PE**: Replace useQuasar with Notify for notification handling at notify.ts ([ae3ca33](ae3ca3310acffbca7f4e1fa9d23698f55cc6e3e1))

### 🔧 Miscellaneous Tasks

-  **PE**: Add config for showing DevOnly components conditionally ([00140c4](00140c45c868a241830bfd222bb7aadfc50d4ef2))
- **editorconfig**: Update settings for pnpm patches to disable trailing whitespace trimming and final newline ([2f72156](2f72156442fc8ce3b52cec61c8e87bc882004465))

## 0.55.0 - 2025-11-06

[Compare Changes](5503652c704f9f7cb8425281d410d641555f5cae...50e7de34e4aa10ffb75e4d2981ae75b96c776e9e)

### 🚀 Features

- **recipes**: Recipe filter added, program template fixes ([e1e8ae4](e1e8ae46bb754cdc73ea6ca1fb8dbe12bf62f0d9))
- **novnc**: Add keyFilter option to NoVncOptions and implement in RFB class ([3906c5d](3906c5dac388f6e4f07851d05f8e315a988d2dd2))
- **nuxt-base**: Add keyFilter prop to NoVnc to filter key events before sending to server ([11bf88e](11bf88e9f09f419761cfaa8687de0147e0c43d92))
- **MachineVNC**: Add preventModifierKeys function to filter out modifier keys ([5736ccc](5736ccc71b5056b3e698d96e529e7bd94c87f9fd))

### 🐛 Bug Fixes

- **recipes**: Rename config `recipesDbDatabase` to `recipesDbName` for consistency ([0fa164c](0fa164c44872d5bc2bb4266630d02ca9b2268660))
- **websockify**: Update db name env names for DMS configuration ([ab2a9e4](ab2a9e445af83d5c77d4016c548c81ea08f0e166))
-  **PE**: Check machine version before adding additional process code to program string ([818d497](818d49780412c77231d9d162841adc1ef902c18a))
- **TonelloApi**: Assume tonello is going to send program codes as string; apply necessary changes to PE ([07d6a33](07d6a330acf1063f72561da109af2b33b00c0c26))

### ♻️ Refactor

-  **PE**: Remove caching logic from machineStore.get method ([51d350d](51d350dd717685d8aa6102286d1fad4cdd3ca22e))

## 0.54.0 - 2025-10-31

[Compare Changes](2a1b3de0fe591ee7dc3a5216fa273a82ecdbbf22...5503652c704f9f7cb8425281d410d641555f5cae)

### 🚀 Features

-  **PE**: Enhance context menu functionality with version management commands ([1e73311](1e73311778a7f6c12039b2435d97841d05c46d35))
-  **PE**: Update copy/paste functions and add invalid step validation ([c28414d](c28414dfd83b4341599d40dacd1cc71fdba9cada))
-  **PE**: Enhance step adaptation logic for machine command compatibility ([aef37e3](aef37e3d4ab8e26b5afc76f6d2371817b30ea917))
-  **MA**: Enhance command type maps with icons and colors for better UI representation ([b959481](b95948180134900e75f67de85074bb7e812f54b7))

### 🐛 Bug Fixes

- **TonelloApi**: Update fetchProgramsList to return response without wrapper ([230e384](230e384523f19bda777c7a598da60ce2c27a82af))
-  **PE**: Resolve Vue warn warning ([10e4340](10e43407c235e5707e5ac76471f8986949b9b7a7))
-  **PE**: Handle undefined steps in selectStep and isStepSelected functions ([ad0d62c](ad0d62c37f112925790b4ca191c3dfa481532022))
-  **PE**: Enhance command execution logic by validating command existence in machine commands ([5b1c719](5b1c719f3efbef106d0c10d9e2596b5c5fe5aec6))
-  **PE**: Removed parameter ([b429761](b429761a62a8bd8d89b218aee6a91f6632b3b970))
-  **PE**: Update command handling to use machineCommand instead of commandNo ([e894385](e894385ddf496bbaf62ecd95f1b0ea924e10a447))
-  **PE**: Rename updateCommand to updateStepCommandFromDefinition for clarity and consistency ([bc65f47](bc65f47f93e109fe4bdee5a097be9996aeb67ffb))
-  **PE**: Remove redundant checks for parameter and IO list compatibility ([ccbdf60](ccbdf6047e9ff0ca7f04d1b72c5a697b3ac4dc06))
-  **PE**: Refactor isLastStep function for clarity and update its usage in deleteParallelStep ([da04957](da04957388815ea9af99405f4b6b3b5b1d76d576))
-  **PE**: Adjust minimum width of step icon container for aligned layout ([c8c79e4](c8c79e47c51214abc77efd39ef5b04b755b2d37d))
-  **AR**: Improve formatSecondsToHHMMSS function to handle negative values ([f038682](f03868256e3182dcf1014e8ff641e5d7290731d7))
-  **AR**: Add loading messages for machine info, job order, batch parameters, interventions, alarms, actual commands, merged commands, theoretical programs, and I/O values ([cb57b23](cb57b236a5528e5d609390b8706156b8a4b74c2a))
-  **AR**: Update Turkish to English translations in batch summary ([db1c4c4](db1c4c487f0f1eb21c77f0bb93325aa409c76345))
- **recipes**: Update database configuration keys ([821d3fb](821d3fb573756e8189e935efa3c2b7d8931a79b1))
- **recipes**: Rename remaining dispensing-management-systems references ([18f1c4c](18f1c4c85be114152231fa7660245c5212dcb7e0))
- **websockify**: Update environment variables for DMS configuration ([863553c](863553c66eaf02484d503eb88788856bbc32ab35))

### ♻️ Refactor

-  **PE**: Streamline CMVersionDialog component structure and improve version handling logic ([42b8616](42b86162e6a93bd76abbebd83f6e077df376768b))
-  **PE**: Enhance error handling and method validation in program version API ([c03ab77](c03ab7721e3287880ba627dff40013456298fe98))
-  **PE**: Update program version handling by removing unused version dialog and related logic ([406f547](406f5470e3a5507c22d7c568d0b498b39c992f5b))
-  **PE**: Update program version handling in MachineController for improved logic and clarity ([933a2d5](933a2d55c1e9180214c52bfb5ac3398ba6c89a99))
-  **PE**: Enhance setActiveVersion method to include new version and operator editable flags ([2d069b9](2d069b9352159aaa8fb7a0a2b8ecbc6646730c9b))
-  **PE**: Enhance CMVersionDialog with tooltips and new version flags for improved user experience ([f73ad86](f73ad86d3329e0280c16776b94a904ca5836b1e3))
-  **PE**: Update process type dialog labels for clarity and consistency ([e304a6c](e304a6cb7923e0310bec908a3a936a0d87fe23b3))
-  **PE**: Update delete version dialog titles for consistency ([6190931](6190931366c0ff2f3ddc7f187a8fe6b2ca7ef745))
-  **PE**: Rename deleteVersion to deleteVersions for consistency and update related logic ([0d1e2c9](0d1e2c9ca68b1c4477d58bf7fc39601dde07bed0))
-  **PE**: Enhance error handling by including machineId and programNo in PError details ([a0762cf](a0762cf19bff66f7d24a3ad62e3c75706920ccb5))
-  **PE**: Update program data handling to improve type consistency and simplify access ([d05507b](d05507be2801f7688bc5806d331c2b6a83620cee))
-  **PE**: Streamline version handling by removing isNewVersion flag and updating related logic ([a41bdd7](a41bdd7fb08ef00898b46081a4b5c4edde6c35c4))
-  **PE**: Update onSubmit and updateProgram functions to include isNewVersion parameter for better version handling ([2355b01](2355b0141e5c47bd8e215670042fb941ae5c0cc5))
-  **PE**: Simplify column definitions and update translation usage in machine table ([ffa8d57](ffa8d5795799454f3c0f62c4dfa4610502bb927e))
-  **PE**: Replace notification calls with notifySuccess and notifyError in context menu ([d21051c](d21051c4752a020e4efe91cb0a20c48d9974f1ff))
-  **PE**: Streamline step handling in ProgramEditor component ([3c10c4e](3c10c4e00204f02334807d1f8f6890b6d8e69539))
-  **PE**: Simplify adaptCommand function and improve IO list handling ([0abb198](0abb19821a9da1654f2b2cc088ded25e77b94e5f))

### 🔧 Miscellaneous Tasks

- **recipes**: Samba dependencies removed ([22c90da](22c90dae74c1457feaed9809bd7a141cc9e4cadd))

## 0.53.0 - 2025-10-24

[Compare Changes](9c3725d3934dc2fcdc91dc95e8ef8684487eff24...2a1b3de0fe591ee7dc3a5216fa273a82ecdbbf22)

### 🚀 Features

- **tbb-ftp-client**: Support new format of batch parameters ([96b3d40](96b3d404e39856a8ca6a50b93e36203b68903f1d))
- **tbb-ftp-client**: Support new format of command parameters ([46fad49](46fad49816d8e34e115c9f955fba6a5a3763048b))
-  **MA**: Add version utility functions for database version management ([dd4f44b](dd4f44bb9521a39de4f98e6c99d5a49fff7fed32))
-  **MA**: Add error handling for missing columns in outdated database versions ([4d66eca](4d66ecada19f3b2e9c661b6100f417161ee6ca08))
-  **PT**: Enhance job order handling and modal management for plan parameters ([3a72460](3a724608881bd661696af95e0becca0ba3aff893))
- **dms**: Machine selection enabled in job order creation for existing program headers ([4c046b6](4c046b6e548bd40f6d87aa339ed33e1988b2d7eb))
- **dms**: Capacity field added to Machine ([781bde9](781bde9f11823848ae54bc2ad253895769d1de9f))
- **dms**: Machine threshold exceed warning added ([321d95f](321d95f7a35f1608bdb2f82e73d02b05a8a457e8))
-  **PE**: Check machine status during program send and show UI notify messages ([2e25f3a](2e25f3a4a059a9cc52ba58ee9710aa576781a5fa))
-  **PE**: Store machines and machine groups in editor ([85d9def](85d9defa3cfec527b3d0cc33ad3a38f2e5959f09))
-  **PE**: Update status endpoint and add error messages ([15fb447](15fb44760af7aff75695ff2572a4f74f181e0c73))
-  **PE**: Check machine connection status during refresh ([c03cda5](c03cda55e4e8113bd2cb2cb85f40ab1a68aef27b))
-  **PE**: Implement machine status store and add connection messages ([16fcfd8](16fcfd8bb732e3da34bd48cb874b60bfee4267fa))
-  **PE**: Add retry connection functionality and improve machine status handling ([9cbf124](9cbf1247eafd129ff066eda85b763c95654ad92b))
-  **PE**: Integrate machine status check into command execution flow ([ef23509](ef235098df5226625c7cbfa93caad712b94cfb6e))

### 🐛 Bug Fixes

-  **PE**: Insert step selections based on io definitions instead of the index of insertion ([8edb249](8edb2491c665d4299b6630be7a12c904b2a4c9a8))
-  **PT**: Correct access to task results in preplanJoborders function ([564f3ad](564f3adb03e805b8bf386314e5cc4a49164be4a2))
-  **PT**: Enhance batch properties API and components to support optional batchKey and isActual parameters ([8170283](817028319206240f2960adfee2322cd5a999e8df))
-  **PE**: Handle cases where valueIndex can be zero when sending tonello program ([7c9ae77](7c9ae77669c0fdcfa88eaa0360c5eed169ba036f))
-  **PE**: Update InputCheckbox styling for dark mode compatibility ([b87edb7](b87edb7a03015d6267487abd3c631d109db9d194))
-  **MA**: More accurate localisation for controller file updates ([6601ecf](6601ecfb871ff946566b71e4ba3d1009bdd26d0b))
-  **AR**: Handle empty program list and raw programs in getTheoreticalPrograms function ([7ddcfb1](7ddcfb1fb01b371cdb873f4f114c4200bb4efa14))
-  **PE**: Filter out undefined icons in stepIcons computation and adjust template for minimum width ([009b827](009b827efb7da0663fe00262c498e66ecc575cc3))
-  **MA**: Allow min and max parameters to be strings in TonelloFunctionParameterValue ([f713875](f713875a0b4364cca14520b7cb7dcc8abd3a6023))
-  **MA**: Set default VALUE for parameters to PARAMLOWLIMIT when null in updateTonelloFunctions ([225ad06](225ad06901814e0117ddb6866a58bec5232b4f3c))
-  **PE**: Prevent browser warnings due to `InputCheckbox` having invalid `for` attribute ([bbcef70](bbcef707c83ac5b8a0ef13ed2a7c0481a4505ea9))
-  **PE**: Enhance error indication for parameter inputs to be in match with quasars highlighting ([afe0c97](afe0c9789786751638da79480c809df549051968))
-  **PE**: Excessive div ([0974cc8](0974cc8a5ab2e540c3d31569295b5c479c000fca))
- **dms**: Settings header style fixes ([9fa0d48](9fa0d48bc993c426e6e7255d9f449fbdb73446db))
- **dms**: SettingsPrograms layout fix ([4dabba4](4dabba40ce7ea39d427ad63892dba57df1ba4b71))
- **dms**: Prev commit ([73ca157](73ca1577114400a6137a308c68f4d61d90195fcf))
- **dms**: UI fixes cont ([9de8fc3](9de8fc3dcf90f55f6514c581e9c4df05fc9a4894))
- **dms**: Wrong program template steps retrieved ([61b2ddf](61b2ddf245a984bab38f1873a57ca37162cdf640))
- **recipe**: Missing unocss configuration ([cfacf17](cfacf1749fa0f2823bdba6dccb6d287a3b0ea960))
-  **PE**: Updated ping method ([d78fe87](d78fe872381bc9204f95d2cd05e878522e8bb394))
-  **PE**: Adjust margin for retry button in machine list ([ecfa89f](ecfa89f075105b7385a293eccaf43fd99e86ee3d))

### ♻️ Refactor

- **TonelloApi**: Rename API methods for consistency and clarity ([3e627ec](3e627ece4cd8ff2c5f9e10445e063c5134f7ea45))
-  **MA**: Change trx parameter type to Knex.Transaction for consistency ([3422c99](3422c99b1f8b5a32004849355f3a009a58887112))
-  **MA**: Enhance DatabaseQueryError to include original error context ([357007b](357007b1a56a8019ae12fb552e13a1d588709a02))
- Replace mssql with tedious in package.json across multiple apps ([6ef19b6](6ef19b6ae4d75375bbbddc61dff788ee5cd93276))
-  **MA**: Update calcIONumber function to use a more specific IOObject interface ([30b21e3](30b21e3d45d031ac2ad5dec2df4975011abda5fb))
- Remove connection test from knex initialization in connectionPool ([3e90ec0](3e90ec043976d3df44e791824fb0b24434e0ba5b))
-  **PE**: Move getMachineStatus function to machineController ([5b995f5](5b995f5af7faad4b20fb7c827be1ac8dbbd9c2a9))
-  **PE**: Remove unused imports from functions.ts ([23fa8b5](23fa8b5a10424d6a27d90556c031e21f5b220a13))

### 🎨 Styling

-  **PT**: Linting ([4ce8e36](4ce8e36bba74059c6fc208e2ecf2681436a1ac93))

### ✅ Testing

- **tbb-ftp-client**: Enhance parsers tests with variant handling, add tests for new formats of batch parameters and command parameters ([c48e790](c48e79012f030465e827466537054c573995ca64))

### 🔧 Miscellaneous Tasks

- Removed `archive-proxy` since its no longer needed due to `iovalues-server` ([bddeff1](bddeff17e144d6d7c272a946da57c14b5ef5798f))
- **tbb-ftp-client**: Add  types for BatchParameter and CommandParameter ([c2f4240](c2f42406fc75814bfdd5d87d71a9cc3d2d4b751f))
- Update lockfile ([070a8f6](070a8f6f805c4573d8a1953b1ac75cc3705a1f1f))
- Rename dispensing-management-systems app to recipes ([89f23f4](89f23f466148084f6ecf6cbce21d4074876b6e65))
- **dms**: Dms to recipes refactor ([d180975](d18097522cbebfd5d508560d7c020a4fce8f85d5))
- **dms**: Unused component removed ([f5f2446](f5f2446e39a3db46bd20847cb64297f3855f3e2d))
- Sync `recipes` version with rest of the apps ([256f5e5](256f5e5c88aec16bee56c6f9d56e5193833a5b04))
- Added recipes back to ci process ([d31e51c](d31e51cb5e92081c237213ad8ff8b415ce5b7b5c))
- **recipes**: Sync dependency versions and update lockfile ([5bc25d3](5bc25d3249295bd6db6b46bbe8b0cfc964d17d4e))

## 0.52.0 - 2025-10-17

[Compare Changes](003ff56b91e5bcea4147a5c6af7064d8179dc073...9c3725d3934dc2fcdc91dc95e8ef8684487eff24)

### 🚀 Features

-  **PE**: Enhance command display with icons and improved layout in TBAllCommandsDialog ([c49e60a](c49e60a0d7aaf35da50d74c1c1c01c3e1f97d8d2))
-  **PT**: Enhance validation logic and localization messages for task scheduling ([3817b4a](3817b4ad067a6db58976c4f7db613fadb763b9b2))

### 🐛 Bug Fixes

-  **PT**: Update event ID formatting for better clarity ([2dddc19](2dddc1920756084cc5f3f6d90cc5866bd7f3ff2b))
-  **PT**: Update event deletion and unplanning to use planKey instead of id ([7258e35](7258e35552a29bdd6c148814ea6e07d77a5d6179))
-  **PE**: Update index of added step ([348723f](348723ffca2c034492944eb10041c51758a69002))
-  **PE**: Add missing program values to createEmptyProgram ([f35d36b](f35d36b926231d15cc3683fb47bcb1e89ac856cb))
-  **PE**: Fetch missing program numbers on editor page ([4dab8b8](4dab8b8feb3c62f82775c6c6241c677235b2847d))
-  **PE**: Prevent special characters input in duration field ([b9c9116](b9c9116dc57e5b0e9e9ffa46850978688de08a54))
-  **PE**: Update parallel step delete button with q-icon ([0f66db7](0f66db74166ae35e6975c766c9b68c7ba5f6e2af))
-  **MA**: Update CARD and CANAL values for input/output mappings ([cd23325](cd233251b4e7062616cd2cac233877b31b569e90))
-  **PE**: Resolve stepId error when adding a new step ([3add808](3add8089d7b8fa614cf36f77f5ce6b6eb806a817))
-  **PE**: Sort io values according to io selection definitions ([5511179](5511179789f57ea2e3a8fa100449c08e05b43c37))
-  **PE**: Adjust step index calculation for better navigation behavior ([517c0dc](517c0dc215e8dd93edb62638518a3aed24459286))
-  **PE**: Prevent duplicate parallel commands when adding new steps ([8e9b9d0](8e9b9d04981821f9c3522191691aa781d8dfe305))
-  **PE**: Add warning notification for missing main step and update translations ([2125de4](2125de4841964cc42a35136dc4f4164080851583))
-  **PE**: Update moveParallelStep command to make programCommand optional and add stepIndex parameter ([25bcc52](25bcc520903664b2d27fb2c3136b4834a1dc37d0))
-  **DM**: Material code should be editable ([3f001a6](3f001a615e5fdae6dbee89849ef96b92659b820c))
-  **DM**: Update button label to use 'create' instead of 'new' for consistency ([c7ca8ae](c7ca8ae93d5bd6eec7534a4820113d713e4e992f))
-  **MA**: Ensure version info message displays a non-breaking space when empty ([e89f790](e89f7908aec1f6c06447847284519bf472367c28))
-  **MA**: Handle network-connection and skip version retrieval for Tonello machines ([b2113a5](b2113a5f001d197ea4d9a30331c66a222b37b790))
-  **MA**: Add random id to data for re-triggering watchers on client side ([4eb5703](4eb5703ac86efa7350e31172b58598bfee4280c8))
-  **MA**: Add translation keys for starting version update and project upload ([306131e](306131ec2523b140124dc8b4b5a858ca37c7da45))
-  **MA**: Add rawMessage field to correctly handle NETWORK_CONN_FAILED errors ([c796d36](c796d36c0e7e1de052a92a26f722bf8994424225))
- **TonelloApi**: Update fetchFunctions to return TonelloFunction array and adjust related types ([85ee84d](85ee84d6e39aba1ae705f3a963648e8761cdce3c))
-  **PE**: Update dialog components and translations for command icon settings ([e83842b](e83842b818fecead9e68f422a4089f092abac370))

### ♻️ Refactor

-  **UI**: Remove "(copy)" text from program names ([8c6b1e4](8c6b1e4065e68b9af8a725fefca8040d37300c49))
-  **PE**: Rename getStepIcon to getCommandIcon and update related usages ([94009c5](94009c5ff280fa1e4c2aba1e0aa59feb7b2cc201))

### 🔧 Miscellaneous Tasks

- Updated lockfile ([a9127d7](a9127d7497de058e41c90fedf69c9094ce3d777c))

## 0.51.0 - 2025-10-10

[Compare Changes](496b21970fb3d4af3b5ad842f88968336eb0105c...003ff56b91e5bcea4147a5c6af7064d8179dc073)

### 🚀 Features

-  **PE**: Design endpoint to fetch all programs, update UI, and add i18n messages ([61227d6](61227d6af8df3d037863aee2abb352bfb9de32ce))
-  **PE**: Design endpoint to send all programs, update UI, and add i18n messages ([dec1c2c](dec1c2c8fd907dee05b10784be8a569c12e9b7cc))
- **dms**: Dms added to app root interface ([0b1ddf3](0b1ddf3e7ab1240057e48d0a1bf5b0d8fdf6a5df))

### 🐛 Bug Fixes

-  **PT**: Update elapsed time calculation to use seconds instead of milliseconds ([1536800](1536800f100d0b22b73e446f47bbdb6c66089134))
-  **MA**: Add 'T710' to supported product models in calcIONumber function ([13c6d8d](13c6d8dfbbc08e09d9d5642b443d2273b4db36e6))
-  **MA**: Refactor updateArchives function to improve version handling and batch inserts ([a5e6f2d](a5e6f2d3c8f49c79fcbc25cf8fc048a5f5280b2e))
-  **MA**: Rename RELEASESTARTDATE to RELEASEDATE in updateArchives function ([efb7605](efb7605254b5625fbd97b3e3e14fe1f3d98b3316))
-  **MA**: Locale key typos for erp parameters update process ([3c5c748](3c5c74830cafef21e6c8aea3aeec1678819e0d12))
-  **PE**: Removed programNo ([1af1849](1af18498f39c8956c93603ce9cb5547c63f58ac9))
-  **PT**: Fixed auto add feature with API endpoints and UI integration ([30d0519](30d0519b85e48f988e9b91bfbe60f4bf0e9e3a02))

### ♻️ Refactor

-  **MA**: Update type definitions to use Omit for CommandIO and IOOutput in parser functions ([1d2e9cf](1d2e9cf3d96ff30359e7c8b0238b5d855779cff1))

### 🔧 Miscellaneous Tasks

- Bump git-cliff to 2.10.1 ([af9d1a5](af9d1a51f930340bd12a9f459f7caa50d2672fb8))

## 0.50.1 - 2025-10-08

[Compare Changes](f342d66e44b847cba7986b208ddd7610bc7411d7...496b21970fb3d4af3b5ad842f88968336eb0105c)

### 🐛 Bug Fixes

- Correct variable name for SMTP recipient in release-apps job ([dbc7fe1](dbc7fe1b0644eed0619c054bbd011c6c4ebe6bf1))
-  **PB**: Update date formatting in Tree.vue and improve type annotations ([70f9785](70f97855025c7b9763765e2fe0d708f13a6f06cd))

### 🔧 Miscellaneous Tasks

- Add iovalues-server target to docker-bake.hcl ([e3b449c](e3b449c72b93c4c21af6593165e2704ec8ca3266))

## 0.50.0 - 2025-10-07

[Compare Changes](94c8b49fde406d28eac92f71c252d7c818ddfa51...f342d66e44b847cba7986b208ddd7610bc7411d7)

### 🚀 Features

-  **PE**: Fixed errors during program copy, updated component, improved i18n support ([a4e3903](a4e39030c99c515131fc72cf78771fa2a7c1ff57))
-  **PE**: Added additional process type ([f728fd3](f728fd369d0466e96684940b009168f6f00f7d74))
- **migration-service**: Add down parameter ([4543227](45432279e500ad8df6582b333454eb16f38716d8))
-  **PE**: Updated ChangeProcessType diaolog ([8da7df9](8da7df9a2e50e63d906280ffc36e280b64e4d522))
-  **PE**: Added additional process type in program table. ([4c97cb1](4c97cb1b7d4ee9c987d55785f96246164c6e73d1))
-  **PE**: Add additional process type migration and update parameter value index ([a5d3c71](a5d3c713caadf1be2f67712b55f096a3b40be79c))
-  **PE**: Add ADDITIONAL_PROCESS_CODE line to program file ([cd55b59](cd55b59375fb1a50e4d1f05d9ce04b50d5c199fa))
-  **PE**: Update parse function to handle optional lines ([a9f2104](a9f210473d6e69036e857e054d43b8c11b8c12a2))
- **migrations**: Add enableLegacyMigrations configuration to control migration execution ([4c67fbb](4c67fbb351859ac990f939258742e1b3bdd9d0a5))
-  **PE**: Make value field settable for process type ([1627f29](1627f29e20ca9da0e53e564e4542515f5e041547))
-  **MA**: Add rows-per-page options to FilterableTable component and update machine-access-fails page ([8b784ef](8b784ef0cc713a31fc1cfabfa8289c71592a496e))
-  **MA**: Add formatSeconds utility for consistent duration formatting ([2215f69](2215f69cf6c651ccc2ba0d738aa5c5559246cd40))
-  **MA**: Implement request count calculation and update logic for command types ([19321fa](19321fa3731d41a8482c2c3ddec435f35ac1ffb7))
-  **MA**: Add success and error messages for request count calculation ([21e3432](21e343213620a4a6afe6c385ce647e14d859a117))
- Iovalues-server ([016a45d](016a45db03188dd5a992d3ff3ada7f2963f731ca))
-  **PE**: Add support for salt and generic material requests in program calculations and UI ([5a2d51a](5a2d51af95c7daa7ad458e0eff7d4eccec358567))

### 🐛 Bug Fixes

-  **PE**: Resolved isLoading error during program copy & paste ([f694cad](f694cad10d34bc4fa16c42d5a8e67ba381beb8c9))
-  **PE**: Use onDialogCancel onHide at `CMChangeProgramNoOnPasteDialog` ([a40b5af](a40b5af08da02e9e08e6d8b5b4931f2458a18c30))
-  **PT**: Correct calculation of realDuration in QueueBased component and update color codes in Tree component ([403697b](403697bd99db0160dbe3c838d12c3d0da8bb48a9))
-  **PE**: Update process types dialog and resolve existing errors ([61e64b4](61e64b4a444ae79bc23477b0e6bf52d45960a831))
-  **PE**: Allow process number to be zero ([ca3785c](ca3785c76cc55e43215a81564da60b9904ed511b))
-  **PE**: Updated parameter group migrations ([9f48cf9](9f48cf95a1dafde2a565b2815663f4cea7c7de35))
-  **PE**: Replace console with server pino logger ([1ef4f02](1ef4f02a5537db697062bff939b86a1a53beaa4e))
-  **MM**: Prevent archive link from displaying when runningBatchStatus is 0 ([23ad9af](23ad9af68f29587a320f0f1334aa2a08aee3edc3))
-  **MM**: Update connection status display logic in MachineCard component ([19448c7](19448c7d07e73ce014d3032aa549389ef39545b7))
-  **MM**: Adjust layout and styling in various settings components for improved UI consistency ([af7c0d8](af7c0d887c450e4bbb1a0c69d68930d60cf3adff))
-  **MA**: Improve machine settings update process with error handling and loading state ([ed17816](ed178166218a0f27b7e24f27e26732ae514636e2))
-  **MA**: Add error handling for user addition and notify on success/failure ([84d12f4](84d12f44edcaeae0e7c45a8c35240377484e4f59))
-  **MA**: Refactor user selection handling and improve validation logic ([60b0a0f](60b0a0f721050a49d9d29a33876c644e527ee4d2))
-  **MA**: Adjust timezone handling in machine access fails API and config ([21bac20](21bac202b304d58516f30d1e4b27f1df46e1069b))
-  **MA**: Update timezone offset environment variable to NUXT_TELESKOP_TIMEZONE_OFFSET ([0703102](07031023f6c4d9bd9eb3716c10a1500eb11d9e2f))
-  **MA**: Adjust timezone handling in closed times query to use environment variable ([a517215](a517215dd4be5077016efe74f0803a148f3d78bf))
-  **MA**: Add duration formatting to closed times display ([d987eec](d987eec6426145e8b9a1910b1d7246bb237f7812))
-  **MA**: Update label for command type parameters to manual reasons ([08e38e7](08e38e72a66393c81b9738e8776f9331422e3235))
-  **MA**: Refactor stopCode assignment in handleAdd function for clarity ([2e06d91](2e06d912c3f1945904c7842fb7c02ca24ca0bb66))
-  **MA**: Enhance error handling in stop reasons API and improve response validation ([51cf855](51cf855f3efad59788a2db21c492d5a7ad4db697))
-  **MA**: Refactor handleAdd function to improve nextId calculation for reasonId ([e51b76c](e51b76c2f0c5b473098568ec68728e1d4da0bb13))
-  **MA**: Standardize statusMessage formatting for ID_INUSE error across stop and user definition handlers ([9184fd6](9184fd68897051a539a3cd798259b464764a8cc6))
-  **MA**: Improve error handling and update command number in smart request commands API ([e9c846f](e9c846fd59c13bfef4efb72c99a8bc89f520c89d))
-  **MA**: Enhance error handling and notifications in machine add, edit, and delete functions ([0f88eb5](0f88eb535d08bec495bed57fe8e7dd2bb4de54a1))
-  **MA**: Enhance error handling and validation in tank definition API endpoints ([e60eb5f](e60eb5f33272116bb240b28c7affa260acb40dc1))
-  **MA**: Enhance error handling and validation in material-tank mapping API endpoints ([a720374](a720374ff00f3a97b17ad148881573a545d7b256))
-  **MA**: Improve material handling in tank management by ensuring state updates on item deletion and drag-drop actions ([f075dd5](f075dd50af5bf6bcfe7245f4827a2f359d0f271f))
-  **MA**: Update batch parameter handling to support multiple parameters and improve function naming consistency ([f078968](f078968bf9b6cdf9ca3f5985ee8321b319762c4a))
-  **MA**: Enhance parameter validation and error notifications in ERP parameter management ([83fbe2d](83fbe2dbd817eaad8bc7fae5646e9d16c92380f0))
-  **MA**: Enhance parameter handling and validation in starting parameter types component ([6e838a5](6e838a53ad0f219d2b2c9b25acb0f2b1583e1e17))
-  **MA**: Enhance error handling and success notifications in treatment parameter and machine group management ([946b832](946b83290ee00b6d1fa38c1969a0b06f2267a9c2))
-  **MA**: Enhance error handling and validation in consumption counter management ([aa025c8](aa025c8732f338477b975b42fcce1093682b6a72))
-  **MA**: Enhance success and error notifications in theoretical water consumption management ([46a5552](46a555258cdf9e85db3cfd5cf54b2a115a133562))
-  **MA**: Enhance validation and error handling for machine parameters and duplicate checks ([b17b85c](b17b85ca207c07f09d87fc5aded7dd8ffaba2262))
-  **MA**: Enhance error messages and success notifications in machine management localization ([10c426d](10c426d5ac70e0f362a3c2db3a49835f46b8aa23))
-  **MA**: Enhance error handling and success notifications for command timeout reasons and machine operations ([bd97c59](bd97c59aa6a3492eaac4070defaeb2e58fc5d6e0))
-  **MA**: Update dependencies and enhance caching mechanisms in machine status API ([33c6338](33c6338dcaf0fd0e54434b34c8427097138eab7d))
- **project-translations**: Removed required login for project translations ([7a45544](7a45544422519acba2548ab7a7b972441be46fb6))
-  **MA**: Simplify duplicate machine ID check logic in API ([12d96d7](12d96d75567b02b454c9ba145855515403451848))
-  **MA**: Zod schemas moved to top level scope ([47ba8f0](47ba8f0037a5c4817c5f4ab02ef3fcf43e7e0489))
-  **MA**: Implement isSQLError utility for consistent error handling across APIs ([5bac808](5bac80851a67561fed6c412776c0beb219967eb7))
-  **MA**: Streamline error handling for foreign key constraints in POST and remove duplicate check in PUT ([503c393](503c393f29489e8b0d871fea4a85f293a63d7f8f))
-  **MA**: Remove redundant tank existence check before deletion in delete handler ([e2a9895](e2a9895cfe2a7625c4d701cd52f9687cd3c30ca7))
-  **MA**: Replace inline IP regex with constant for improved readability and maintainability ([c05bd9d](c05bd9d0d0f64d00858f69ecc06aec82e8c2271f))
-  **MA**: Remove redundant existence checks before deletion in delete handlers for treatment parameters and machine groups ([1c17ac9](1c17ac9d7162de0a521d2d38ad9f372c4debd625))
-  **MA**: IsSQLError should handle AggregateError ([d662659](d6626599dfd6e4052252c281d489e558f6c05d58))
-  **MM**: Added missing sortMachine default & bottom margin for defaults button ([d719d3d](d719d3d720eedf123deb41529f92d67aeecc2a3a))

### ♻️ Refactor

-  **PE**: Update process operation functions ([36a75cc](36a75cc05da85784c781888338aa45787f90d0eb))
-  **PE**: Updated create process type components ([4395021](43950214bc1291f63913418d30cad384af70f2ab))
-  **MA**: Standardize SQL error handling with MSSQL_ERROR constants ([79bf2f7](79bf2f7e843472e6a865d029cf6d16f68da6d88b))

### 🔧 Miscellaneous Tasks

- Add node-app generator with configuration, database, and server setup ([2115230](2115230a03ce97633008aaaf73a6da893321ecdd))
- **migration-service**: Update migration files ([1bf9193](1bf9193f12c63e7ef06967860fadf83f5d000c49))
-  **PE**: Update process type naming ([c615f7c](c615f7ca5c45c4572762cb7b4e0b0059dca9137c))
- **migrations**: Move changes made in migration files to their separate migration file ([c9c1c4d](c9c1c4d172ae825e45aa241c39117e6f778cd760))
-  **PE**: Drop redundant PK validations ([5557751](5557751fe9837a3212da0b7100a6a9b37c1f956b))
-  **MM**: Mobile UI for new settings modal ([452e50b](452e50b422aa0f0f1fd5d6f611569ad34745e4ad))
- Update lockfile ([19a0f3d](19a0f3dcb2c39dcd019aa29dd1b7bfe7cb11d3f9))

## 0.49.0 - 2025-09-29

[Compare Changes](b2c8a6f56e69d0c1eb85f30e4f0441e71fb8b630...94c8b49fde406d28eac92f71c252d7c818ddfa51)

### 🚀 Features

-  **PE**: Add VALUEINDEX column for Tonello integration and update related types ([4382d9f](4382d9ff2c94d344b2d63443bcc1ea3b2daccf64))
-  **PE**: Add new error codes and details for machine parameter validation ([ff5088e](ff5088e70ba15641d2da4b90b36e646a4e549caa))
-  **PE**: Implement TonelloProgramClient for integration with Tonello API ([22147f0](22147f0a6d4970b7369ceabc960a40572889e218))
-  **PE**: Handle Tonello integration ([6686963](6686963b6d8d76957fda608e8537757fcde4251e))
- **utils**: Add type utilities ([562d79f](562d79fdd00a377ff4f182f3ee0f69d401f45382))
- **core**: Add TypeScript types for Teleskop database tables and enums ([ecf05af](ecf05af3a7c197035bb070843a73d7efbddb1017))
-  **MA**: Add Tonello project update functionality ([a2e60a8](a2e60a8b66499e45b3d6f5c4270f863a6b27056f))
-  **MA**: Enhance sync/update-machine endpoint with Tonello-specific updates ([c4afaf7](c4afaf74b83fa7a3ab2674d41590ec6cbc2017c4))
- Add SELECT_ADDITIVE parameter type and update related components ([dadd64b](dadd64bf166e6fdd51483773fe9646c82a1401aa))
-  **MA**: Enhance AddEditModal with additional props and validation improvements ([bad8db3](bad8db3840c8359957fa93010c1a07d49e8b9dda))
-  **MA**: Enhance machine version check and teleskop connection handling with model-specific logic ([6c736ec](6c736ec23059a8fcb8d51cbf2648eacb8b3f6821))
-  **MA**: Add support for additive function parameter type in updateTonelloFunctions ([4ef2929](4ef292989fba7b2f49fe855b277c50c6335623c8))
- **core**: Add fetchDatetime and updateDatetime methods to TonelloApi ([c210f82](c210f828523109882c10b4d8bdf875859a94e0e0))
-  **PE**: Separate chemical request counting for Tonello model ([ba1d787](ba1d787a8d4b5dc89d5f7ab418b5d053d420216f))
-  **PE**: Improved grouped parameter styling ([01c8697](01c86977dca49e39148824cb53d51326455d9a28))
-  **PE**: Add InputCheckbox component, modify parameter inputs to have dynamic width instead of fixed width ([83155a6](83155a68a7a79f8ff81b00b6a4cc1a4ef72c1ae3))
- **TonelloApi**: Add fetchStatus and submitBatch methods; update TonelloResponse type ([354dd60](354dd60fb6934a174aa62de072fca6659db2e4de))

### 🐛 Bug Fixes

- **utils**: Update `env` prop to support array of strings and adjust related logic ([d00cca4](d00cca4dbeb0512f469ddb13e38ffd3ba55b0b3a))
- **config**: Update environment variables to support both standard and NUXT-prefixed names ([f43df02](f43df02a62afa66c85507b3b991c2e513b57b50a))
- **utils**: Update isDef function to exclude null values ([4aaa30e](4aaa30e89199707fcba9057099db5558cfc77cf1))
- **core**: Add missing private and license fields, and define scripts and devDependencies ([e3431ae](e3431ae4ab107a515e48da67d87e5292d4f01cdc))
- **core**: Update type imports and response types for TonelloApi methods ([8dcd9e9](8dcd9e987fecdbd5cb732cbd48af1f781dc62c79))
- **scripts**: Remove timezone offset from NUXT_DMEXCHANGE environment variable generation ([4b4936b](4b4936b35aa2d278e557d79e22142d1e26df9f66))
- **config**: Update configuration management by adding README and removing deprecated dev.json ([b980cc0](b980cc079ca92d7dc14130801b5b5504c87ae630))
- **scripts**: Add Keycloak configuration to environment file generation ([340332d](340332d62385bc51aee6a01d65053aef2e7225ea))
-  **PE**: Set default tbbModel to 'T7700' and update type to MachineTbbModel ([d4b6622](d4b66229c8112fa9d13b7a73974f7b069fe0bb8b))
- **core**: Tonello type changes ([29cf788](29cf7881d54991efe1cb12b71c834bce34718448))
-  **MA**: Handle null index in Tonello functions to prevent processing errors ([d83b3e2](d83b3e24c5944d065ac12ede3a6473da5ae0b6ce))
-  **MA**: Add API no response error message and update error handling in machine update process ([11b8453](11b845397e02d343171f8e9b2709b1c6858acdc7))
-  **MA**: Prevent adding empty messages to translation rows in updateTonelloProjectTranslations ([631bc08](631bc0822ebf0018808625b59a717bc829359adf))
- **project-translations**: Include machine_id in global translations query to ensure accurate mapping ([8898b3c](8898b3cd5c185249b2fff12689990bcff4be2b1f))
- **nuxt-base**: SubMenu visibility check to support ref/getter for item.disabled ([614164e](614164e1baf2d67b74b5b8f309d2e98056f34398))
-  **MA**: Refactor and fix issues with MachineList page ([763f707](763f707c6ef32ac9c6a5708b3fdc75ab9b2afd0d))
-  **PE**: Improve command validation and label handling ([3c943ba](3c943baa99e6d94884dfeb5a92626d9ba31f732b))
- **project-translations**: Change locale initialization to useLocalStorage for persistence ([0102f3c](0102f3cce9e01d220c5c128e30700c4e5f6b0e3a))
-  **PE**: Machine page not having single root element ([a77d874](a77d87442b92a173b0326cc5c0d4012d7bde7ee8))
-  **PE**: Remove obsolete TopbarProjectLocaleSelect from topbar ([37a0a79](37a0a797d3bda4f254c3d3188459de7a2985e227))
-  **PE**: Conditionally render operator checkbox based on isTonello prop ([02e63e6](02e63e627eeac9a6bfda57894b67326375f51efc))
-  **PE**: Refactor checkbox handling to use model for binding and simplify state management ([af2e4a0](af2e4a0243cd2597c1c8c022eb76503c2edbdd3e))
-  **PE**: Wrap NuxtLayout in a div for proper structure, always visible vertical scrollbar ([09714f6](09714f6a2a76f72f960e4cb3818b7670546a4df5))
-  **PE**: Prevent InputNumber from trying to parse numbers under specific conditions ([18f633b](18f633bf0ce662d5e9894739f2d9fe126c2b69ad))
-  **PE**: Add workaround to remove odd padding in QField when no labels are provided ([a748176](a748176e839688391e58873ae91aabc39f4ef75f))
-  **PE**: Remove unnecessary padding class from search input ([48109e7](48109e79b591d99a9c24932870d0e9c620b5cad6))
-  **PE**: Change scrollIntoView behavior to 'instant' for improved performance ([f4deb5d](f4deb5d64ffc4a1fc06aae8b56d0e942cd325c12))
-  **AR**: Add missing CHECKBOX type to ParameterType ([6198f1a](6198f1aee6d34c631cd41298e0e3a919c080a5a7))

### ♻️ Refactor

- **migrations**: Optimize column existence check for PARAMETERGROUP in BFCOMMANDPARAMETERS ([5ea2e98](5ea2e980a44dbf598cc20a3e2bb116ec5f09540b))
-  **MA**: Update ContextMenu component props and usage across multiple pages ([d403a63](d403a63fdcfe6933e0f53b71c31936a1bb679775))
-  **MA**: Remove obsolete FTP command alarm reasons and locks general endpoints ([64395e8](64395e84f98e8fe6ea20d96fc41c69b98ab6ec7c))
- **bump-version**: Consolidate package.json updates into a single loop for efficiency ([f1c3028](f1c302810bfc9b85b632d37832820f34ed81c3a8))

### 🔧 Miscellaneous Tasks

- **migration-service**: Add `generate-migration` script ([def09ca](def09ca198f81702c727063be94ddd06ee058251))
- Add script to generate .env files based on config ([84921de](84921de4aca32f19d8aeb6183315f80c66d3f1bf))
-  **PE**: Remove unused Vitest configuration file ([05d772b](05d772b55a7258ef3f3f7f5ff6a5d8eb2859b4dd))
-  **PE**: Add `@teleskop/core` dependency ([8fdef4f](8fdef4ff5b785b698e89dbf2ab401f0cc9dd7236))
- Update base image to node:22.19-alpine ([12549f8](12549f84165412db85e1dbcbf1b03e44b8f2aed7))
- **cliff**: Include build commits in miscellaneous tasks group ([f4ba67c](f4ba67cd57c14a6c84e99480c444b28ab8c55e5d))
- Update lockfile ([9844106](98441067c456f53b20b7fc41f951c83b5d02b916))
-  **PE**: Minor jsdoc fixes ([1671857](1671857f3d7c5231fca30d403e7b638de96c2e02))
- Update lockfile ([b183bd8](b183bd8c8cdff4ae3d46663a021372f76eda3162))

## 0.48.0 - 2025-09-12

[Compare Changes](7210afb650b29c01646b617b2d9df2a28d310700...b2c8a6f56e69d0c1eb85f30e4f0441e71fb8b630)

### 🚀 Features

-  **MA**: Add button for loading project translations ([4424f5c](4424f5c9484bc3a36e971ae1e7651e877ce92bf7))
- **nuxt-base**: Add `trueLabel` and `falseLabel` options to `FilterableTable` ([b42633a](b42633a0102b09498acd4af653d3eb29d803ba29))

### 🐛 Bug Fixes

-  **AR**: Rename `active` field to `batchStatus` and label icons/filters for status ([fe38f5c](fe38f5cfe69d11d1820f43d64287d095fee548e8))

## 0.47.0 - 2025-09-12

[Compare Changes](397b4d40c0396cabdc7cb74f8ff471dc18de9c15...7210afb650b29c01646b617b2d9df2a28d310700)

### 🚀 Features

-  **MA**: Form validation ([58ee0ee](58ee0eee365d766a84f8fcba5de7e4c3864e0b16))
-  **PE**: Store program errors in errorStore, update types, and display errors in program table ([57a1dba](57a1dba1422772ffec5085168456605b29ef4148))
-  **PE**: Add context bar button to check selected programs ([445dfe5](445dfe5e3802dc4bb8e1280606dc87a4783d65fa))
-  **PE**: Add machineId to program errors ([f085874](f085874f09a784ec5ce356b0703fbd6b1ded016e))
-  **PE**: Add machineId filter to getStepError function ([63838ca](63838cadeb7bb4df0e0172778bbfcad47a1e8e46))
- **nuxt-base**: Truncate text with tooltip on overflow ([bdf801e](bdf801ef0b2bc3290e59179d4dced43485fa76b4))
-  **PE**: Use useProjectTranslations() method for project translations ([2cf4838](2cf48387bcc9213f826e6ce44fd30db76274c3d1))
- Add `@teleskop/core` ([8fd4047](8fd40470735fe072d0be5301b0df2c8d0a3fe903))
- **migration-service**: Add migration service with all required db modifications ([dd1d8cc](dd1d8cceaf2a63654695054b3a5963843c17a687))

### 🐛 Bug Fixes

-  **PE**: Run type check and resolve existing errors ([85399e3](85399e3ccc8d0edcdd4b8e6004b7d71dcb116a22))
-  **PE**: Update notificationState and adjust CSS ([1643f8e](1643f8eda3623087d5b6d56d205aea360e8601d8))
-  **PE**: Add missing types ([0becc5d](0becc5d452691982384e0b45219e4d5d0606f399))
-  **PT**: Fixed program legend coloring ([94a25f6](94a25f60e4a8b7cf8c4a812422187c2070dceb0d))
-  **PE**: Hide inactive machines in Teleskop ([8f93ad4](8f93ad454c157e7582d916915c6663d732cd52f6))
-  **MA**: Fixed machine delete handling ([893cb4a](893cb4a8f6d35ca5ea87d98521d769ee1bfccf21))
-  **MA**: Default inuse value should be true ([aae9ade](aae9ade74ae747fa7bdcf3e89ab6478e72c942ae))
-  **MA**: Added useinteleskop as true by default & readonly ID ([b876f1f](b876f1fad6bc9505c5402fe42e646c0e56d65142))
- **build-utils**: Handle array-like `exports` and correctly parse dynamic imports ([a15e3a9](a15e3a996ac034490f07d780752e72f6b5644d99))
- **migration-service**: Handle bundling, remove compatibility level migration ([39cb826](39cb8265428d545b8e558257ce60bff2cfd727de))

### 🔧 Miscellaneous Tasks

-  **PE**: Remove unused component ([4b92dfd](4b92dfd6b6fcc912c0ce9c79f92079ec74a6f1da))
-  **PT**: Added party no search to joborder search ([4b5b645](4b5b645a463449f225676e67f52bc0b0572126b7))
-  **PT**: Updated recipe modal ([3073a31](3073a31b3325a4d90f8694c656d0fbdaa4d9215d))
- Use `--env-file-if-exists` instead of `dotenv` ([d621550](d6215501343e107ad842e396dbf79a5aee4a3447))
- **nuxt-base**: Merged topbar auth components ([121f2e1](121f2e1eadd6066029e51d950ee3738fe8a8f8c9))
- **nuxt-base**: Added project translations to TopbarMenu ([d497382](d497382a79750c2ac30808d2f02cb7790ac73604))
- **utils**: Rename `textTruncate.ts` to `string.ts` ([96b9a8f](96b9a8fed2bdac85974a26fe0cf61ae4f6adb093))
- **tsconfig**: Disable `noUnusedLocals` and `noUnusedParameters` ([6f48c59](6f48c591bab2a8997eb1ea574df8aa92b0db2bf1))
- Add `migration-service` to pipeline ([781c1eb](781c1eb5841d82862fa9943105f2e9113f6914fe))

## 0.46.0 - 2025-09-10

[Compare Changes](e8231420b17ebe6a281b4bd10a496955c6bdd0bd...397b4d40c0396cabdc7cb74f8ff471dc18de9c15)

### 🚀 Features

- **utils**: Added `insertBatch` function ([086c482](086c482026237c980513bde4cef5c25189f51cba))
- **project-translations**: Add endpoint to retrieve available locales ([64971e0](64971e0835f79788ea5b70e241dd531dee741d20))
- **project-translations**: Implement `useProjectTranslations` composable for locale management ([4acda04](4acda04bff34dbaade22d04c1afacb8e07011c6b))
-  **PE**: Add project locale selector ([0ffc7ed](0ffc7ed6504e23f29ea8953f91807be4e9792e6f))
-  **AR**: Add 'active' field to job order table and implement custom cell rendering ([6690c00](6690c006d5b5e0342fbf18568e669d5921bf8942))

### 🐛 Bug Fixes

-  **MA**: User friendly icons for SseLogDialog ([864de5e](864de5ec1f021c9cc253143e64f6ea4c6fcfe70c))
-  **MA**: Modify `updateMachineTranslations` based on latest db changes ([3ab55eb](3ab55ebcc291b38265864cbc84d0e5a80e79d453))
- **project-translations**: Add primary key to `BFPROJECTTRANSLATIONS` ([ce5c9dc](ce5c9dc0abb2a2ae3473ad8ac95ee0a4318333e0))
-  **MA**: Use `toSorted` instead of `sort` ([eaaa729](eaaa729695d0333f3cf3ec25ad671d8239b7355f))
-  **MA**: Filter out unused project translations ([29ef18c](29ef18c4b570f3daa35e642546081557ebcec6d9))
- **project-translations**: Migrate translation endpoint and plugin to use new data structure ([715166e](715166e27ec896b9802e17b20a9b80afa48be252))
- **project-translations**: Disable fallbacking, escape i18n keys ([06af624](06af6245ae096484edea70f03be3542fd88da666))
- **locales**: Update "locale" key to "App Language" for consistency across translations ([ebd28c2](ebd28c2ab9b281f0c00b99fe19f018f14008290d))
- **nuxt-base**: Remove invalid `extends` ([6e57707](6e577075e6251e4f14988f05023b4710b9730b06))
- **project-translations**: Rename migration for future flexibility ([2b33d56](2b33d561272cee1529c9e6bee5db78b4c1354638))
-  **MM**: Update timezone offset reference in alarm list API ([9473033](94730333243340c3a83b2ff617dda97bebb3e92c))
- **nuxt-base**: Add `h-unset` for round topbar buttons ([39832d2](39832d252eee8e7c4c07b87b6fc4e456a43c0dbd))
-  **AR**: Add new calculated values keys, make it future proof ([aa5c878](aa5c87866297efb752ce988d2e18a1d4fe47d499))
- **project-translations**: Missing constraints in migration ([334f418](334f4187ce82df45a74ffe5d35c6a57b69fc7fef))
-  **AR**: Replace usage of `router.push` with `navigateTo` ([dba3340](dba33405790b35f48aac367fa3067377ed1674b7))
-  **AR**: Reactive layout component titles and alarm table columns based on locale ([bbe2ee6](bbe2ee63ceb01c65e4a90f01c77e6587b76b23c8))
-  **AR**: Better error messages when batch fails to load ([4906ac6](4906ac629e156fe3b31e73aa016e8712de57c552))

### ♻️ Refactor

- **project-translations**: Move `insertBatch` utility to `@teleskop/utils` and update import path ([de32866](de32866af823ba86fb43e9788d07eb3fb92ea4f2))
- **project-translations**: Change supportedProjectLocales to use Object.freeze for immutability ([f671c34](f671c347df67e24f23b70060c261744ab831bf4f))
- Replace `useMachineTranslations` with `useProjectTranslations` across components ([a8bf877](a8bf8775f57947888e135febfd5cd0118edfa124))
- Removed `twName` default values from `nuxt.config` per app ([a50a1de](a50a1dea0a7287460d8ee47b8e347f5b0c9197e4))

### 🎨 Styling

- Disabled `ts/consistent-type-definitions` rule ([c18725c](c18725c03b897d37332fcc5f454563525761ed66))

### 🔧 Miscellaneous Tasks

- **project-translations**: Migrate to new data structure ([36688e2](36688e2ad396a44947b5365e329f5230679af990))
- **project-translations**: Remove `projectTranslations` locale ([ef41cda](ef41cdaa7101d2d26657998d45de3c1b265a0e46))
- **project-translations**: Add `TopbarProjectLocaleSelect` component ([efb963c](efb963c6858d02ca39875db3c0f65d52c720287e))
- **nuxt-base**: Remove unused component ([f171cfc](f171cfc921594c28e19aa7e1730b739482cc524e))
-  **MM**: Change default `machineStatusUrl` to better align with the dev environment ([128f4f1](128f4f1a2bb82fb3fa3ef4e7eb4dfddbe1a27ceb))
- Update lockfile ([4a776b3](4a776b320a67cdbcbe81032f56d0694ae8923e63))

## 0.45.4 - 2025-09-08

[Compare Changes](be3d75a20275f12efd71b5670edeac0b7a787269...e8231420b17ebe6a281b4bd10a496955c6bdd0bd)

### 🐛 Bug Fixes

- Nitro dev server not detecting ignored requests ([0b0e1f9](0b0e1f9e3525ba5da83c8489b19c68bfcaf22362))
-  **MA**: Fixed menu access permission dependent permissions ([cf8e5b2](cf8e5b211e1456ad8abbdd393d6769f2f9c4a878))
-  **MA**: Fixed an issue where updating erp parameters caused missing user entries ([6118b6d](6118b6dfccdb20454c7fa1a2555340002edf6601))

### 🔧 Miscellaneous Tasks

- Updated cliff.toml, removed unused parsers ([37f4d3c](37f4d3c33ead6abc04f257495bfeeaacc2050d1e))
-  **MA**: Meaningful sse error messages ([b944545](b9445459fb2bd27c338cfa4b1ba7b696f1d4600a))
-  **MA**: Remove debug console.log ([3dad2bd](3dad2bd63d9ecf0b8ed842a5fc3526a89ca00a03))

## 0.45.3 - 2025-09-03

[Compare Changes](51d7f4e21f0fbe6fc9e6e495430b6ebd47b083ba...be3d75a20275f12efd71b5670edeac0b7a787269)

### 🐛 Bug Fixes

- `bump-version` not staging all `package.json` files ([2b6267e](2b6267ec3cab4b3e58fa38e180cb0baa063ca4eb))
-  **MA**: Fixed option check for machine add modal ([1d9de87](1d9de87210996b584aef002ba750966fb0d16e68))
-  **PT**: Fixed formatSeconds function to expect negative values ([3228b46](3228b465d65caa9bc8469a7359b0ad340f73b8c0))
-  **PT**: Added missing translations ([900d2a7](900d2a7386d78e6ee9226d4fc4b0b0f511fbfda1))
-  **PT**: Joborder search wasn't highlighting events from outside of daterange ([bca9a37](bca9a372a7ec5e88b71eaf4d59e54f9f828a4494))

### 🔧 Miscellaneous Tasks

- Added CHANGELOG.md generated via git-cliff ([f1914db](f1914db626d917e4205c9be37fb285dcffc7d019))
- Added `bump-version` script ([b8832eb](b8832eb2ecfa73d1aafc3df41dc7e75bccb3cf1d))
- Added `version` prop to `package.json` files ([078b57f](078b57f938c13ffdb93689bc9356e9f8a8517a50))
-  **MA**: Updated version update & added sse logs ([b812042](b812042496b108d75894c2d5be0c6f43a6929ed9))
-  **PT**: Added theoretical duration, actual duration and deviation to tooltip ([578c2da](578c2da55f65b091882f797f24bfa62555b76cba))
-  **PT**: Added stops duration & formatted seconds ([3ba10c4](3ba10c44ed98bb35c5d7ca60b0e788695ac170b8))

## 0.45.2 - 2025-09-01

[Compare Changes](d58d808a7da8c4cb9d3b7612e85b2cb3b1e2a359...51d7f4e21f0fbe6fc9e6e495430b6ebd47b083ba)

### 🔧 Miscellaneous Tasks

- Upgrade pnpm to 10.15.0 ([205f88c](205f88cdebb48031687f4b481aaaecd5c335850f))
- Disable git branch lockfile ([f31195f](f31195f12d524e5949753e1f93802158c22df0d3))
- **fix**: Merge pnpm fetch and install into one ([51d7f4e](51d7f4e21f0fbe6fc9e6e495430b6ebd47b083ba))

## 0.45.1 - 2025-08-29

[Compare Changes](05e1b853d154467b80467593b508f02811f35520...d58d808a7da8c4cb9d3b7612e85b2cb3b1e2a359)

### 🐛 Bug Fixes

- Upgraded turbo to fix `turbo prune` not correctly handling pnpm patches ([c6f32da](c6f32da05cd15a07a721cb853cda60820d8ad341))

### 🔧 Miscellaneous Tasks

- **bake**: CI_COMMIT_SHA is no longer required ([d58d808](d58d808a7da8c4cb9d3b7612e85b2cb3b1e2a359))

## 0.45.0 - 2025-08-29

[Compare Changes](ca2cb9a8af123c543987adb99a9b836bdc7f6cd0...05e1b853d154467b80467593b508f02811f35520)

### 🚀 Features

-  **PE**: Add FTP client implementation for T7 machines ([33715d7](33715d738db4e0620d62484c3f7f68ec50d4dfa5))
-  **PE**: Add withProgramClient decorator for connection management in ProgramClient ([ba89426](ba894269ee641f14c0938215636f8bc131ae5a2a))
-  **PE**: Add commands as parameters to downloadProgram and uploadProgram functions ([9c19e79](9c19e79a0267fa3b8b9bf5c237fde45935ce7b09))
-  **MA**: Allow notStartsWith rule to accept parameters ([b64179f](b64179f8b2b1ef3d0fc7731fca7489a8de91a746))
-  **MA**: Add notStartsWith rule with single argument support ([a4322fe](a4322fe303f0179a355e78c69884b2e4980b256b))
-  **MM**: TW-156 added custom sort ([936efb7](936efb7f26e348889f83c5f9fea88ea60d3c4d09))
-  **MM**: TW-157 erp parameters multi select ([dfe7e68](dfe7e682c95f26dc58bb7c24fd4b251913f73913))
- **utils**: Added `tryJsonParse` ([812948c](812948cc631883d7169b735d0dbc19931f4e17e8))
- **utils**: `defineConfiguration` accepts `querystring` type ([38620af](38620af057afc1eca4ca49a55bb2c439c2405c81))
- **utils**: Config objects accept function type for `required` prop ([34afea2](34afea23d0631e489aa683f0aa6397bebe552927))
- **machine-status**: Accept granular database props ([d24861e](d24861e34da658ecb98dd564062af980fc923cb1))

### 🐛 Bug Fixes

- Hide warnings for missing machine translations ([4324686](43246864812d1417d8c87d1bae6853662cb34794))
-  **WS**: Incorrect event being removed when destroying ProxyHandshake object, couple of incorrect types ([3673424](36734242026f5adb2de6ae633eb98dbbf8293ecb))
-  **PE**: Reset selected programs when navigating to editor page ([38b0f77](38b0f775621efa93490014e4b8b68f8780f36bd0))
-  **PE**: Resolve client error in machine_id and ProgramClient ([86241b8](86241b8bb23e3d31f8c68af522b0493bb7799b23))
-  **MA**: Add min/max length validation and prevent leading zero ([4a871dc](4a871dc7532da878c07599535082e54835ffe4bb))
-  **MA**: Set minimum userId to 0 ([4b5f21d](4b5f21d34cfeb091ac885925c28743efa0e0d8a2))
-  **MA**: Update user-definition.put.ts endpoint to fix save error ([06fc983](06fc9838d1af2eab193778434d9c81ad1663fbdf))
-  **MA**: Resolve issue with setting user settings ([d881259](d881259483ada41c9f68afcfcccf286d1029775d))
-  **MA**: Close dialog when user settings are changed ([b321679](b3216791fe812cabaa8446532b7d3cc1e3a93d8b))
-  **MA**: Show notify when user permission update fails ([66da7da](66da7dafb0f2a889096ab8837d474b2a787fa710))
-  **MA**: Moved plugin that adds `BFMACHINETRANSLATIONS` to `@teleskop/project-translations` ([6328abd](6328abd32cf0cbb97712a33ac46586ff6372e694))
- **nuxt-base**: Ordering of page down/up button in `MachineVNC` ([0100799](0100799629bb432da1665da80f9a4dc36fd95b26))

### ♻️ Refactor

-  **WS**: Use `config` object for keycloak configurations instead of `getEnvOrThrow` ([e8de65c](e8de65c0385a9292210065889e16df5777b80353))
-  **PE**: Move program operations from MachineController to ProgramClient ([bc27bfc](bc27bfc0544dce85ea4635ae61ce677655005693))

### 🎨 Styling

-  **PT**: Renaming ([a3a3e36](a3a3e36709430e832876247cef3dc276bfdd603a))
-  **PT**: Rename cont ([be994fb](be994fbba6b41c8d50b3b1d2c3591e41c0c9363e))

### 🔧 Miscellaneous Tasks

-  **PE**: Clean up unused functions in MachineController ([e9808cd](e9808cdaf0957d4f38c72bbad4a0ff3c36467b4f))
-  **MM**: New settings UI ([685601a](685601a2c99a52c9371d2e000798c8e5210c1508))

## 0.44.0 - 2025-08-25

[Compare Changes](f2c7096adc91217897150c59b5c211a138994362...ca2cb9a8af123c543987adb99a9b836bdc7f6cd0)

### 🚀 Features

-  **PE**: Calculate chemical request counts and include in program header ([7ff7c4e](7ff7c4ed2d77837d90086688536bac4c093e4052))
-  **PE**: Add new parameter type 'CHECKBOX' ([6765f79](6765f794019e3f05a9f92e811969df33d657d0c9))
-  **PE**: Add tbbModel column to machine entity ([bf65a90](bf65a90a33adc5d300860eff0e385db964f49c07))
-  **PE**: Add `visible` prop to CustomQBtnProps ([00b87bb](00b87bb30323df4b67117471911b364350e010d8))
-  **PE**: Add control for Tonello machines ([f77b0ad](f77b0adafeb9018ce8c236913e75677ae5014336))
-  **PE**: Add isTonello check for process type ([d4d8f1a](d4d8f1a7763a633ea8a169b9043ee91618c1872c))
-  **PE**: Control context menu button based on Tonello machines ([f8ac430](f8ac4301a7be8b5fdcfd3213a718618ffccd0b8c))
-  **PE**: Add parameter groups to commands and update UI to display grouped parameters side by side ([436fb0b](436fb0b6520b733c1704769b212adf6f9959bc66))
-  **PE**: Added hidden type to programs table. If Tonello machine, the program's process type is hidden. ([7e2ab04](7e2ab04ec1b3b292c7a1e48f5858b0b1cdadf256))
-  **PE**: Added an info button to the context bar to view command details ([1130a5f](1130a5f102a022a48913cd26c3099552d050592f))
-  **PE**: Add Nitro plugin to ensure PARAMETERGROUP column exists in BFCOMMANDPARAMETERS ([663cad9](663cad9329270758eca0cdd4e730c428aaac4f1f))
-  **PT**: Auto plan unplanned events on app mount ([f612a72](f612a723294a2ddba6b51a9dc0e60273402acd67))

### 🐛 Bug Fixes

-  **MA**: Removed redundant main page routing ([c0b9e20](c0b9e200fc1b32f965f1cdcee93abf2e0f73c728))
-  **MA**: Adjusted context menu size ([bb0d643](bb0d643e4104d0cb7524156706deb0a94522c751))
-  **MA**: Fixed&updated MachineList component TW-161 ([3cadcbb](3cadcbbc26f5618b6812f029f23c7ba693f25a8e))
-  **MA**: Fixed&updated index page TW-155 ([b2a225b](b2a225b41d681e93c07fc1593b7891333ba49d01))
-  **PE**: Update parameter types for compareHeader ([df5fa59](df5fa59dbc7a21c2a56b4564403c4c4bf948fcd0))
-  **PE**: Add missing or correct incorrect types ([12f2243](12f2243ba35316b6c6a000cb141cd07f399c4f23))
- **utils**: Added nullish checks to `filtersToKnex` ([92be7e4](92be7e438f62e96b8c994cb4d793c35252e31379))
-  **PE**: Updated tooltip text to ContextBar ([da0bbd7](da0bbd71b5877eeef34d5e76151f300b3a61f1ff))
-  **PE**: Control expand state with v-show ([f577b6d](f577b6d48a03adac2686c0048db80d6d5e15f4db))
-  **PE**: Allow parameterGroup to be null and handle safely ([786ae3f](786ae3fd413712f4ae1c3070fca265d4cc9027fa))
-  **PE**: Style issue resolved ([e904122](e904122040a77a85b867a2ec4e54192c59ffa805))
-  **PT**: Added en-GB locale to bryntum ([da018c9](da018c9f76d70b1001f541364e1c5778fdb74a2b))
-  **PT**: Program types ([23c5935](23c5935efc5155998f6b1269cf5aab5004c57b5e))
-  **PT**: Added missing translations ([9388e26](9388e26d5a34143f38e1ae4a27995deddb40ffd7))
-  **PT**: TW-166 removed unused api ([e1cbd1c](e1cbd1c5f3f0971a36d0235499cf02cce97df13a))
-  **PT**: Renamed unplanned function ([7a2b771](7a2b771543c45532ca035874643b78ddc627e639))
-  **PT**: Named parameter binding ([c6f75b1](c6f75b17a1657f6b810df490f40ec7b0c48f4aa0))
-  **PT**: Removed redundant computed ([78958df](78958df9f2277a722997f7ee8982783fe4ff972c))

### ⚡ Performance

-  **PT**: Optimized unplanned event query ([f929f29](f929f29c0ce3ef80b3e2bd9c9264a6542dda2fab))

### ♻️ Refactor

-  **MA**: Assigned repeated long expressions to a constant ([ce41109](ce411095aea4643983ccab61a7fe5dae5385db26))
-  **PE**: Replace ftp with fetchRemoteProgramList ([b3c6fe8](b3c6fe82365bd2e9b0ac233e6e7b1e3962718e33))
-  **PE**: Rename title for consistency ([bec5c76](bec5c7694671eb5ec1742865bd672a19e7161d36))
-  **PE**: Apply guard clause to machineId endpoint ([cbbb7c9](cbbb7c92ad569f55c88a7164cfeac657f13364db))
-  **PE**: Remove editor from CMNewProgramDialog and pass program numbers via props ([d0eb27c](d0eb27c4540d4053f07831e43fa81d0cdd48d1d2))
-  **PE**: Remove getProcessTypes and use allProcessTypes from editor ([be0a474](be0a4746292dc2a26264432da3ddbb1e905e99eb))
-  **PE**: Converted isTonello to a computed property ([be698b2](be698b22b104bb53c89767b02625ea2868310dda))

### 🎨 Styling

-  **PE**: Rename few locale json keys ([abed282](abed2826eece9eff77890aed92c839ae055899df))

### 🔧 Miscellaneous Tasks

- Remove incorrect usage of NITRO_PORT from bake file ([322ea8e](322ea8effae31c1d31e36d056b61be7571b23933))
-  **MA**: Created modal component for add and edit modals ([f5677ed](f5677edd9b722a12222602905a1745cab529d75d))
-  **MA**: Added mixing&additional locales ([24dfc1b](24dfc1be84150ae585143d1a767dc63ec8a401bf))
-  **MA**: Updated machine fetch query to include mainTank and steamValve queries ([8100d82](8100d82f622a14424fb7d3c6048aacc28c208411))
-  **PE**: Update JSDoc comments ([181c1a0](181c1a02b2e561db3a6efebc363420bde08c9216))
-  **PE**: Clean up Program type by removing machineName ([ee14cf5](ee14cf597e0974b3c9e50f466f2e63e662b46e70))
-  **PE**: Remove unused imports ([de1b60c](de1b60cec81cba6c2952e64ebe42f560fdb73d19))
-  **PE**: Make `group` nullable, remove unused interface ([dbf8cfa](dbf8cfa76e03f28037b6db8c695fd6447390c2f5))
-  **PT**: Added real and theoretical duration to batchProperties programs ([3ac089b](3ac089b0a33daa72ad4105f4b788fb1625586fc8))
-  **PT**: Batch properties update ([78412cb](78412cb3e16c3c4101440321c3176970b2190302))

## 0.43.3 - 2025-08-12

[Compare Changes](d82a460f33e06f6467aa1688c6471d5d3556d672...f2c7096adc91217897150c59b5c211a138994362)

### 🔧 Miscellaneous Tasks

- Fixes to gitlab-ci and bake ([f2c7096](f2c7096adc91217897150c59b5c211a138994362))

## 0.43.2 - 2025-08-12

[Compare Changes](72bc5c31a21e9934d76ea15d3932ef96fc084ded...d82a460f33e06f6467aa1688c6471d5d3556d672)

### 🐛 Bug Fixes

- **root**: Finalize look on app ([d82a460](d82a460f33e06f6467aa1688c6471d5d3556d672))

## 0.43.1 - 2025-08-11

[Compare Changes](ab2add20c9cf5324c22686634079a76b02e4f531...72bc5c31a21e9934d76ea15d3932ef96fc084ded)

### 🐛 Bug Fixes

- **root**: Missing dependencies and start script ([7747a52](7747a52407ab0707806d060dc0f5d629e0432b2e))

### 🔧 Miscellaneous Tasks

- Update lockfile ([72bc5c3](72bc5c31a21e9934d76ea15d3932ef96fc084ded))

## 0.43.0 - 2025-08-11

[Compare Changes](822a8105b9eda6a06ad0fb8359e65638ae5343d8...ab2add20c9cf5324c22686634079a76b02e4f531)

### 🔧 Miscellaneous Tasks

- Updated lockfile ([ab2add2](ab2add20c9cf5324c22686634079a76b02e4f531))

## 0.42.5 - 2025-08-07

[Compare Changes](d3819dff7ebaeb598cbab02b0d45b5e4fb86ca6c...822a8105b9eda6a06ad0fb8359e65638ae5343d8)

### 🚀 Features

-  **PE**: Add tooltips to buttons in context bar ([142c5c6](142c5c670956213efdf23095cda37e6c1fd4135f))
-  **PE**: Calculate timezone on SQL side ([00c196c](00c196c356bdf12b8d63bc9d7293f866054e2bd6))

### 🐛 Bug Fixes

-  **PE**: Fix error in change program  name ([208068c](208068cec9aa8516c414e662137c01e4319ad80f))
-  **PE**: Update header endpoint implementation ([a283fea](a283feacbfda30312f594d08c41f1f34fa99b2f7))
-  **PE**: Disable buttons in context bar when appropriate ([eb6cd7f](eb6cd7fdb3cf211f9b68c896be617f88a30920b5))

### ♻️ Refactor

-  **PE**: Improve program type switching logic ([df22726](df22726d5a11d4025654bdf68a4b9441caec05a2))
-  **PE**: Rename 'changeName' to 'rename' for consistency ([1901934](1901934352db9d4cb04c86f67b9beb9f87e4b3aa))
-  **PE**: Update context bar icons ([9b06c2b](9b06c2bd5ff3a568b6bf1c38f7cc94acddeae9d4))
-  **PE**: Extract EXISTS_ONLY_ON_CONTROLLER check into a variable for clarity ([91890d3](91890d3e145f9e2d14974a810ee52042fcd5c5a5))

### 🔧 Miscellaneous Tasks

-  **PE**: Remove unused function ([5bc0d03](5bc0d031ae3af96304e1dc3f3184c74d49641a80))

## 0.42.4 - 2025-08-01

[Compare Changes](4769f3a2a4d4adf751bb5e28e5ac363f55a7bc66...d3819dff7ebaeb598cbab02b0d45b5e4fb86ca6c)

### 🚀 Features

-  **PE**: Add program existence check and new dialog component for handling fetch ([c656dd5](c656dd582362528f762fbba2f4ae269c9746e5f1))

### 🐛 Bug Fixes

-  **PE**: Corrected incorrect type definition ([5731d53](5731d538fa546e889353dae512e211f2efb2b875))
-  **PE**: Resolve program status errors ([65f9f8d](65f9f8d8b52ad3ec51486a88cf7c4b838d8fae10))
-  **PE**: Add check for 'programHasErrors' key ([4a42d10](4a42d1012a1a0b391a06d27ba4741c3ee2963256))
-  **PE**: Compare time difference instead of strict equality ([14860a4](14860a49aaa36562d0b01ef0cb16735c7dfb23e9))

### ♻️ Refactor

-  **PE**: Update downloadAndSaveProgram function ([5a520cd](5a520cdc94c648b2367254bce0f1f969c65fefb9))

### 🔧 Miscellaneous Tasks

-  **PE**: Add downloadProgram function to download endpoint ([e3cb408](e3cb408fb74c97e3ba83cc55084b9be5428a6c26))
-  **PE**: Rename functions and remove unnecessary try-catch blocks ([db13296](db13296bcc952102f143f21530dc23e7590b95d9))

## 0.42.3 - 2025-07-31

[Compare Changes](36278f910f69cf03602c1059e50ef8f9528d77ce...4769f3a2a4d4adf751bb5e28e5ac363f55a7bc66)

### 🚀 Features

-  **PE**: Add custom error messages to sendProgram and getRemoteProgram, update i18n keys ([c66e3bc](c66e3bc6d09d42db78172d8072ea0c2e160dc2ea))

### 🐛 Bug Fixes

-  **PE**: Update download endpoint with custom PError messages ([0373377](03733771716c23657873734a7eae9d70024ca90d))

### 🔧 Miscellaneous Tasks

-  **PE**: Remove unused types from error.ts ([ed2dd25](ed2dd25ce3f65892996d6a2b58247ec01a8e4c84))
-  **PE**: Add is isProgramError function to check for specific program errors ([915c49e](915c49e3ffa6327fa594e96e0600d23b4a4c4533))

## 0.42.2 - 2025-07-28

[Compare Changes](7e616d616917cf401cbf233a4240929a69f7c0cb...36278f910f69cf03602c1059e50ef8f9528d77ce)

### 🚀 Features

-  **PE**: Add data check to download endpoint ([ee71aab](ee71aabf416837f7a64f982af208bba5f115506a))
-  **PE**: Disable context menu when program exists only on the controller ([9ab4fa5](9ab4fa584103445722b638925cd6676fc45ac27e))

### 🐛 Bug Fixes

-  **PE**: Fix program status color issue and set 'TBBCHANGEDATE' as null on new program creation ([ce5eb1f](ce5eb1f84ca233f0b012d22fe9f245dc0dbaad59))
-  **PE**: Rename 'programState' to 'prgState' to resolve data mismatch ([25f6d68](25f6d689cde8ae335c128e4acdd883cb736640eb))

## 0.42.1 - 2025-07-18

[Compare Changes](7eadd5329499d6c1b4d2774b07fb4115adbbadd7...7e616d616917cf401cbf233a4240929a69f7c0cb)

### 🐛 Bug Fixes

-  **MA**: Added sse message reset ([77b7d56](77b7d569a98372c50df2e7fdec50d4418a90d92a))
-  **MA**: IoName nullcheck ([b059dc8](b059dc88f1399c7eb916e0ed7e4a911d56667853))

## 0.42.0 - 2025-07-18

[Compare Changes](add3e9f96bd6a628f1af115ed410dc8efc0ddc1a...7eadd5329499d6c1b4d2774b07fb4115adbbadd7)

### 🚀 Features

- **vnc**: Foldable keyboard ([5114a7d](5114a7db343981fa1299d0d0e04ab2f07ddf8cc4))

### 🐛 Bug Fixes

- **nuxt-base**: Loading spinner spinner color fix ([17d2a1a](17d2a1a46149d7d899c7413cd4617ddbdf1f5670))
- **vnc**: Expand icon color ([1b10e87](1b10e87df578fac11cd101d10d8718f3f7b0c781))
-  **DM**: Typo at disable attr ([27afa17](27afa17f64baff870f1fc519e7bcb70a73644bb4))

## 0.41.1 - 2025-07-18

[Compare Changes](1fe50b6277d5cf303fceced1b7979a21fb0fd7a2...add3e9f96bd6a628f1af115ed410dc8efc0ddc1a)

### 🔧 Miscellaneous Tasks

- Update lockfile ([add3e9f](add3e9f96bd6a628f1af115ed410dc8efc0ddc1a))

## 0.41.0 - 2025-07-17

[Compare Changes](529f936258e260c7d06e418b2eeb9c9aed6e3ff5...1fe50b6277d5cf303fceced1b7979a21fb0fd7a2)

### 🚀 Features

-  **PE**: Implement changeProgramName function to update program titles ([902b332](902b33281e66f44e748591eb4b06f4205b2ac68b))

### 🐛 Bug Fixes

-  **PE**: Resolve program merge errors and add appropriate types ([126bfc7](126bfc7580c31e51a8b59c0a62c42dc2bf97c869))
-  **PE**: Correct type error ([26213c8](26213c8dccabf5b8e25273ba61cba4f136d11c6c))
-  **PE**: Correct invalid type definitions ([d54af26](d54af26d634f8e5ae8ec47bf7d75cacfd2ced9ae))
-  **MA**: Added default calibType and wrapped function with try catch ([ad526e9](ad526e9413451d5635450a68e3d704f904cde3fa))
-  **MA**: Added upsert logic to updateERPParams function and converted translation function to transaction ([bcc9a0a](bcc9a0ab458709928525bc983278f5f582838ca8))
-  **DM**: Added scale viewport prop to vnc ([58245d1](58245d1f6e2ac089ee6a655e8b9381802252ceef))
- **nuxt-base**: Rename userRoles to userResourceRoles, change data structure ([36136ad](36136ad2261ff86b6c0bd063dd8a253eb8f28844))

### 🔧 Miscellaneous Tasks

-  **PE**: Remove unused components ([78acda3](78acda347a648875552cae853d1356162b9dd851))
-  **PE**: Rename `ProgramTable` to `ProgramTableRow` ([1b5b689](1b5b6890c34a27d38f1037694042417b6259df7b))
-  **MA**: Sse ([df92876](df928768528485941b2280f40a9a35cf00a531b4))
-  **MA**: Updated sse and added sse modal with translations ([5c2991a](5c2991a363440b02aaca491a87a7728127356af0))
-  **MA**: Updated database update logic and sse messages ([acbe333](acbe333223881fb346e5f64f8d2da3c930da3e65))
-  **MA**: Added ensureConnected function ([397824b](397824bf644515c5be9929ee9159befa9fb5f771))
- **keycloak**: Added userRoles ([99d0b19](99d0b196f49ed51cc16be24d78ca5e13b7d1f418))
-  **DM**: Added role check for fields related with any kind of data update in recipe ([c6cc770](c6cc7706dac73317aaca383f0edb28cfa84697c7))

## 0.40.6 - 2025-07-04

[Compare Changes](5301524ea78949ffc883cf6671ccc464aa38911a...529f936258e260c7d06e418b2eeb9c9aed6e3ff5)

### 🚀 Features

-  **PE**: Add existence check to program endpoint with conditional create or update ([6f7059e](6f7059eeaa6d55a90239dbf063790999288e6d6b))
-  **PE**: Implement copy endpoint ([3a81ab0](3a81ab0a2b7c917499b836ec2aaa33a4d38540cc))
-  **PE**: Create CopyItem and ProgramItem types and update pasteProgram logic ([3082c97](3082c97b10264ae47248106ba6a4af3b35333d24))
-  **PE**: Add jam package ([4f786f8](4f786f800511c88ffaab41310261045243dbe981))
-  **PE**: Update copy endpoint implementation ([13754e8](13754e89d7687882e4a0d9bc56783cbe7a7941fe))
-  **PE**: Create mapObject function ([af3653c](af3653cad327fa85bd5518819493668c4c5abcaa))
-  **PE**: Added JSDoc ([9ce414b](9ce414b4132a68f33c3642dfd8e4ab05816d21dd))

### 🐛 Bug Fixes

-  **MS**: Changed float cast to TRY_CAST ([fe1d1c1](fe1d1c19913ef32b93526b37e3f7098ad81c8e15))
-  **MS**: Typo ([0ca34f4](0ca34f403e99f72c4b6a35f67f42aaeac6516549))
- **nuxt-base**: Remove v-bind usage to resolve color issue in loading spinner ([c1aaa82](c1aaa82f4a815b464ba2ca765985cb8ee3cea033))
-  **PE**: Clear previous errorsIds when fetching program ([05b5b7d](05b5b7d8423696ef029755a3337ec426c23d6c2c))
-  **PE**: Update program copy endpoint ([462c9ee](462c9ee27d660ee64ead608499ad6f66d28d4385))
-  **PE**: Rename variable ([eca71e7](eca71e779c22601cf31e16614cab0cdc2c2e71ac))
-  **PE**: Removed console.log ([5d288ff](5d288fff670bbabeeff317589c8fba26f5711f53))

### ♻️ Refactor

-  **PE**: Update program copy component ([14efc34](14efc34a21228aca2aa9da9e81f930722fc906ab))
-  **IM**: Update CMChangeProgramNoOnPasteDialog component ([7b9ad8f](7b9ad8fb5bcb329a1e98a0c913ca831e400254a6))
-  **PE**: Remove method check and add .post call ([db03614](db03614604246f61f8626d4f0570b2d4a407217d))
-  **PE**: Update updateProgramHeader function ([e2f29a3](e2f29a3459592510d0b05e76253ccdb35310b316))
-  **PE**: Update CMChangeProcessTypeDialog component ([bc54fe7](bc54fe7fe39d6cd938b44bc7ffc023317c67ccea))

### 🔧 Miscellaneous Tasks

-  **AR**: Comments ([916e634](916e63482fa39990d40125e6b17f2eb8794baca8))
-  **PE**: Minor code updates and cleanups ([2e2f8cd](2e2f8cd6b381b3903fe5151df83c840e45f6dea0))
-  **PE**: Correct type ([d6e036f](d6e036f6c9885e6c2d783c986dbc5c3c1a7ae551))
-  **PE**: Minor non-functional changes ([bf30e88](bf30e883e4c69dd848a8ed166ab0003c37b7d5dc))
-  **PE**: Remove unused function ([3337ab2](3337ab26bde1707c1b3cc6deca85af86e91aae43))

## 0.40.5 - 2025-06-30

[Compare Changes](f64650f8838668cefbb2926dce638386738874f0...5301524ea78949ffc883cf6671ccc464aa38911a)

### 🐛 Bug Fixes

-  **MA**: Added missing lastForJobOrder to DYBFBATCHPLAN join ([03003a8](03003a832878da7ef1496886ece694f2135b6543))

## 0.40.4 - 2025-06-27

[Compare Changes](f8c94ca536f6b7134d6513d76d4b4382eb45a172...f64650f8838668cefbb2926dce638386738874f0)

### 🐛 Bug Fixes

-  **MS**: Typo ([ee2fd69](ee2fd6998426575084647e53a7040cd935d135f5))

## 0.40.2 - 2025-06-26

[Compare Changes](c0b8d3590157aa7596e0dc816b9fcccb740ec7ea...e8e06e7d6cabab02c0fc13613b0ca6661d03db05)

### 🚀 Features

-  **MM**: Implemented project translations ([4824c6a](4824c6a193a28e232129b605e581f7a6c3f74f45))
-  **PT**: Added project translations ([5cab6c1](5cab6c12d694f65710fcb59e21932d99f8230c2e))
- Project translation ([8daf3e0](8daf3e0cc1ec219af23bcfcab22387d7298043ff))

### 🐛 Bug Fixes

-  **MA**: Deleted redundant project translation files ([fa1879d](fa1879d67c1650f9fe9516dae934b91b8bf1b05f))
- **project-translation**: English locale key changed ([7f29769](7f29769baabd73f85d3b42c72341a34a4de8dc14))
- **project-translation**: Updated variable names, where to parse and added \n for safety ([70c9f58](70c9f58ef2d787d8ca9bceb4ecf852ee43b05ccb))
- **project-translation**: Changed locale key to mt and updated en default key to en-GB ([7f66f01](7f66f016fea9b5f24c09e70ab48cd50b5d03f4bf))
-  **MM**: Recipe table amount float value correction ([3c2c268](3c2c268bc92bc4e1f3eb793e5452bf0f47765561))
-  **MM**: Removed redundant overflow hidden ([de7ddaa](de7ddaa68143222a642b70f4e18093fe6d3e413e))
-  **MM**: Added timezoneOffset env variable ([b85c48f](b85c48fd74aea16148a3044b83e3272b43591171))
-  **MM**: Usage pie chart calculation is now made with running fabric weight ([c387deb](c387debea3a022378a220bb4e011cf83097056a6))
-  **MS**: Removed forgotten codeline ([80a8db0](80a8db0392dae6b529564c33e50cf70dde30224b))
-  **MS**: Changed elapsedTime to utc date ([9629e2d](9629e2de0841571f8e82fe36659ffd32ad7be515))
-  **MM**: Changed alarmStartTime to minute from hour ([70e0d89](70e0d897a7b7e642921b03b099179a3776a07fdc))

### ⚡ Performance

-  **MS**: Changed runningFabricWeight query for optimization ([6630974](663097442c5fe2268fa10f45c48ae13c96b7cf35))

### ♻️ Refactor

-  **MA**: Upsert logic for BFMACHINETRANSLATIONS ([8618263](861826357bc05a8d6a21cd4a99733609dd33294b))
-  **PT**: Changed source and method of retrieving fabricWeight to a more reliable ([8ebafaf](8ebafafa22a42a4e0e5a38ed2157fd70e50bad70))
-  **MM**: Refactored date formatting ([e612419](e612419968fff1e82ba6545ebbefb2dae9a6bb3b))

### 🔧 Miscellaneous Tasks

-  **MA**: Read & write machine translations to database ([dc88706](dc88706785c81bedad96c8f4b967959a3cf9ec08))
-  **MA**: Updated machineTranslations and test & added i18n locale ([4d9b9e1](4d9b9e1b54a78ed1aecfc8ab1ff3b37fd6c75a27))
-  **MA**: Added fallback language ([62427d2](62427d2eec826c2e86eb08907811e4ae14d5955a))
- **project-translation**: Improve existing translation handling and database insert logic ([c663447](c663447d47fb00ef18f510c48adbb5f915a374fe))
-  **PT**: Removed `@teleskop/ui` usage ([9cfe069](9cfe0698c4de5b436e03bb03373cdc4bded00b51))
-  **MM**: Details page css update ([feb3d2a](feb3d2ae71b8749cab47d127a986ea063aeca068))
-  **MM**: Moved textTruncate function to helper & added textTruncate to details info ([ce479e0](ce479e0353c34081c3e861dead98a1cd20492189))
-  **MM**: Removed redundant spaces & implemented elapsed time in stop reasons ([80a1997](80a19975a90391e8c93373dd0ed0fd039e1d8f44))
-  **MM**: Added elapsed time localization ([9e072ae](9e072ae8aa5c74cef9bfee4b96ab1052c299baa3))
-  **MS**: Added runnin fabric weight to machine-status ([5df5884](5df5884a74c92a8a16a72fb0f1d756665863fddd))
-  **MS**: Added timezone offset & running plankey ([441092b](441092b7b053eca6968b246f8830819548e61e74))
-  **MM**: Added production value & fixed capacity calculation ([217fecc](217fecc197d4277235fb1a26f54c1b8890d8e8f2))
-  **MM**: Added info tooltip and text color ([ef34a88](ef34a88c0b0dfd6c70f19016e7eb50bfeac90186))
-  **MM**: Added runningPlankey type ([416811c](416811c8fb75be0642275a025c5721e60abb43cb))
-  **MM**: Removed unused files ([b73c079](b73c0793174c9afce0b76933f132fa6930a05497))
-  **MM**: Teleskop recipe table ([25f4c47](25f4c47a628ef95f068bf40a0ec54eec859bcd69))
-  **MM**: Added recipe amount ([39a3b5b](39a3b5b9d14df4c07cf6da092a9a5fbc79a93445))

### Refactgor

-  **MM**: Relocated textTruncate function ([0fc7738](0fc77385a2d8e64d4881ad0c7fa9fbda1b147082))

## 0.40.1 - 2025-06-11

[Compare Changes](802c980ee3dba2943f9a78f73bae3b7232e92644...c0b8d3590157aa7596e0dc816b9fcccb740ec7ea)

### 🐛 Bug Fixes

- Use `en-GB` instead of `en` ([ea176c1](ea176c1fe8675ac6fbbbdf7cba03ded070044fd7))
-  **PT**: Removed redundant TOP 1 in planned party no query ([01077fe](01077fe9c5ebe5a889b3aad8ed294d6090485428))

## 0.40.0 - 2025-06-11

### 🚀 Features

- **nuxt-base**: Added more customization options to LoadingSpinner ([7929360](7929360d0472d7d526493bb403b0c9e51a81ff13))
- **nuxt-base**: Improved NoVnc UX ([fa07214](fa0721472d5bde15c49c549e9e7c05d2a7a8fde5))

### 🐛 Bug Fixes

-  **PE**: Remove unused import ([dcc5f35](dcc5f35fe5e39ecd26600f2dbc8b4a9096da3ea7))
-  **WS**: Stop reconnecting to server after client disconnects ([cf52d84](cf52d84f6556ac4ece6250d6e65ea669a412f200))

### 🔧 Miscellaneous Tasks

- Moved `@teleskop/ui` to `@teleskop/nuxt-base` ([8b969f4](8b969f420aecb7f444556c6fedad4045799a8eb8))
- Update lockfile ([4297611](42976114cb0873a100dec9439515dfeb1ba5f8dd))
-  **PT**: Added party no selective name ([908223a](908223ad819c00cea6ae7573dd2bc2e4ed5c7e81))

<!-- generated by git-cliff -->
