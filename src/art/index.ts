/* PUBLIC API of the art module. Two agents share it:
     art-characters → src/art/characters/* (Lumi, Borrón, 8 guardians), src/art/companions/* (8 species + accessories)
     art-worlds     → src/art/worlds/* (backgrounds, predicaments, crystals, stars, chest, map decorations, icons)
   Until implemented, exports come from ./stubs. Replace each re-export line with the real file when done. */
export { Character } from './stubs'          // (props: CharacterProps)              — art-characters
export { CompanionArt } from './stubs'       // (props: CompanionArtProps)           — art-characters
export { Predicament } from './stubs'        // (props: PredicamentProps)            — art-worlds
export { WorldBackground } from './stubs'    // (props: WorldBackgroundProps)        — art-worlds
export { Crystal } from './stubs'            // ({ color, state: 'locked'|'empty'|'glow'|'collected', size }) — art-worlds
export { StarIcon } from './stubs'           // ({ filled, size })                   — art-worlds
export { ChestArt } from './stubs'           // ({ open, size })                     — art-worlds
export { Sparkles } from './stubs'           // ({ active, color, count })           — art-worlds
export { LumiHorn } from './stubs'           // ({ crystals: boolean[8], size })     — art-characters (Lumi's horn lighting up with collected crystals)
