/* Dev/QA only (not part of the public API): one import that shares the app's module instances, for scripts that
   inspect the live engine from a browser (page.evaluate(() => import('/src/audio/devtools.ts'))). */
export { audioState } from './index'
export { getAnalyser, peekEngine } from './context'
export { activeSfxVoices } from './sfx'
export { music, __musicPlayerForTests as musicPlayer } from './music'
export { speech } from './speech'
