// #1209: the bundled surveys extension is a side-effect deep import without
// published types (posthog-js ships surveys.js but no surveys.d.ts).
declare module "posthog-js/dist/surveys";
