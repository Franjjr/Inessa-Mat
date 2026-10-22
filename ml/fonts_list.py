"""Handwriting-style Google Fonts used to synthesise digits. TEST_FONTS are never used for training."""

_TRAIN = [
    'Caveat', 'Patrick Hand', 'Gochi Hand', 'Indie Flower', 'Kalam', 'Schoolbell', 'Shadows Into Light',
    'Gloria Hallelujah', 'Covered By Your Grace', 'Just Another Hand', 'Reenie Beanie', 'Nanum Pen Script',
    'Coming Soon', 'Architects Daughter', 'Short Stack', 'Sue Ellen Francisco', 'Annie Use Your Telescope',
    'Delius', 'Mali', 'Itim', 'Sriracha', 'Handlee', 'Neucha', 'Pangolin', 'Kristi', 'Homemade Apple',
    'Rock Salt', 'Waiting for the Sunrise', 'Loved by the King', 'La Belle Aurore', 'Zeyada', 'Over the Rainbow',
    'Dawning of a New Day', 'Nothing You Could Do', 'Cedarville Cursive', 'Swanky and Moo Moo', 'Shadows Into Light Two',
    'Gaegu', 'Klee One', 'Chilanka', 'Comic Neue', 'Edu SA Beginner', 'Edu NSW ACT Foundation', 'Edu VIC WA NT Beginner',
    'Edu TAS Beginner', 'Playpen Sans', 'Grape Nuts', 'Square Peg', 'Caveat Brush', 'Mynerve', 'Delicious Handrawn',
    'Oooh Baby', 'Hi Melody', 'Gamja Flower', 'Yomogi', 'Zen Kurenaido', 'Sedgwick Ave', 'Nanum Brush Script',
    'Kavivanar', 'Delius Unicase', 'Andika', 'Atma', 'Rancho', 'Walter Turncoat', 'Crafty Girls',
    'Give You Glory', 'Mansalva', 'Kranky', 'Sniglet',
    # school handwriting models (Playwrite = national school scripts, incl. Spain)
    'Playwrite ES', 'Playwrite ES Deco', 'Playwrite FR Moderne', 'Playwrite IT Moderna', 'Playwrite DE Grund',
    'Playwrite GB S', 'Playwrite US Trad', 'Playwrite MX', 'Playwrite AR', 'Playwrite CO', 'Playwrite PE',
    'Playwrite NL', 'Playwrite PT', 'Playwrite BR', 'Playwrite CL', 'Playwrite AU NSW', 'Playwrite NZ',
    'Playwrite HR', 'Playwrite PL', 'Playwrite CZ',
    'Dancing Script', 'Kaushan Script', 'Marck Script', 'Patrick Hand SC', 'Hachi Maru Pop',
]
TRAIN_FONTS = list(dict.fromkeys(_TRAIN))

# Held out: evaluation only (different designers / styles from the training fonts).
# 'Amatic SC' was dropped from the held-out set: its ultra-condensed digits (width/height ~0.25) look like
# "1"s once normalised with preserved aspect ratio, and children never write like that.
TEST_FONTS = [
    'Permanent Marker', 'The Girl Next Door', 'Fuzzy Bubbles', 'Borel',
    'Stick No Bills', 'Gluten', 'Shantell Sans', 'Dekko', 'Just Me Again Down Here', 'Unkempt', 'Bad Script',
    'Nerko One',
]
