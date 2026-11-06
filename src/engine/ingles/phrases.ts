/* Frases de Inglés de 3.º para `eng-complete` (eng:frase:*): seis frases originales por tema, en inglés británico. Cada
   frase tiene un hueco («___») y tres opciones: la respuesta y dos distractores que no sirven en ese hueco. Los sustantivos
   salen de ENGLISH_WORDS. Las ideas de las pistas son generales: no nombran ninguna respuesta. */

export interface PhraseItem {
  /** The sentence with one gap written «___». */
  sentence: string
  answer: string
  /** Two wrong words for the gap. */
  distractors: [string, string]
}

/** The first hint of each phrase topic: the idea, in Spanish, never the answer. */
export const PHRASE_IDEAS: Record<string, string> = {
  'eng:frase:saludos': 'Piensa en cómo se saluda o se despide, y en la hora del día.',
  'eng:frase:its-a': 'Fíjate en el animal: cómo es, qué sonido hace o dónde vive.',
  'eng:frase:this-is-my': 'Piensa en quién de la familia es la persona que se presenta.',
  'eng:frase:i-like': 'Piensa en lo que te gusta comer. El verbo cambia cuando hablas de «he» o «she».',
  'eng:frase:can-i-have': 'Es la forma educada de pedir algo en una tienda o en la cantina.',
  'eng:frase:im-wearing': 'Piensa en la ropa que llevas puesta ahora mismo.',
  'eng:frase:classroom': 'Es una orden de la clase: piensa qué hay que hacer en el cole.',
  'eng:frase:where-is:in': 'Piensa en algo que está dentro de otra cosa.',
  'eng:frase:where-is:on': 'Piensa en algo que está apoyado encima de otra cosa.',
  'eng:frase:where-is:under': 'Piensa en algo que está por debajo de otra cosa.',
  'eng:frase:ive-got': 'Piensa en lo que tiene una persona o un animal: partes del cuerpo y cómo son.',
  'eng:frase:weather': 'Mira el cielo y la ropa: ¿qué tiempo hace hoy?',
  'eng:frase:what-day': 'Piensa en el orden de los días de la semana o de los meses del año.',
}

export const PHRASES: Record<string, PhraseItem[]> = {
  'eng:frase:saludos': [
    { sentence: '___, Mum! I am fine, thanks.', answer: 'Hello', distractors: ['Thank', 'Sit'] },
    { sentence: 'How ___ you?', answer: 'are', distractors: ['is', 'am'] },
    { sentence: 'Thank ___, Mum.', answer: 'you', distractors: ['yes', 'dog'] },
    { sentence: 'Hello, I ___ happy.', answer: 'am', distractors: ['is', 'are'] },
    { sentence: 'Bye, Dad. See ___ later!', answer: 'you', distractors: ['yes', 'no'] },
    { sentence: 'It is ___ to meet you.', answer: 'nice', distractors: ['big', 'tall'] },
  ],
  'eng:frase:its-a': [
    { sentence: 'A mouse is very ___.', answer: 'small', distractors: ['tall', 'cold'] },
    { sentence: 'An elephant is very ___.', answer: 'big', distractors: ['cold', 'hot'] },
    { sentence: 'It is a cow. It says ___.', answer: 'moo', distractors: ['woof', 'meow'] },
    { sentence: 'It is a fish. It can ___.', answer: 'swim', distractors: ['fly', 'sing'] },
    { sentence: 'It is a bird. It can ___ high.', answer: 'fly', distractors: ['sleep', 'read'] },
    { sentence: 'It is a cat. It says ___.', answer: 'meow', distractors: ['moo', 'woof'] },
  ],
  'eng:frase:this-is-my': [
    { sentence: 'This ___ my dad.', answer: 'is', distractors: ['am', 'are'] },
    { sentence: 'This is my ___. She is my mum\'s mum.', answer: 'grandma', distractors: ['baby', 'brother'] },
    { sentence: 'This is my ___. He is my little brother.', answer: 'brother', distractors: ['sister', 'grandma'] },
    { sentence: 'This is my ___. He is my dad\'s dad.', answer: 'grandpa', distractors: ['baby', 'sister'] },
    { sentence: 'This is my ___. He is very little.', answer: 'baby', distractors: ['mum', 'grandma'] },
    { sentence: 'This is my ___. She cooks in our house.', answer: 'mum', distractors: ['sister', 'grandpa'] },
  ],
  'eng:frase:i-like': [
    { sentence: 'I ___ apples.', answer: 'like', distractors: ['likes', 'am'] },
    { sentence: 'She ___ bananas.', answer: 'likes', distractors: ['like', 'is'] },
    { sentence: 'I don\'t ___ cheese.', answer: 'like', distractors: ['likes', 'is'] },
    { sentence: 'Do you ___ pizza?', answer: 'like', distractors: ['likes', 'am'] },
    { sentence: 'He ___ cake.', answer: 'likes', distractors: ['like', 'am'] },
    { sentence: 'We ___ bread.', answer: 'like', distractors: ['likes', 'is'] },
  ],
  'eng:frase:can-i-have': [
    { sentence: 'Can I ___ some milk, please?', answer: 'have', distractors: ['like', 'am'] },
    { sentence: 'Can I have ___ apple, please?', answer: 'an', distractors: ['a', 'some'] },
    { sentence: 'Can I have some ___, please?', answer: 'bread', distractors: ['an', 'a'] },
    { sentence: 'Yes, you ___ have it.', answer: 'can', distractors: ['is', 'am'] },
    { sentence: 'Here ___ your sandwich.', answer: 'is', distractors: ['are', 'am'] },
    { sentence: 'Can I have ___ banana, please?', answer: 'a', distractors: ['an', 'some'] },
  ],
  'eng:frase:im-wearing': [
    { sentence: 'I\'m ___ red shoes.', answer: 'wearing', distractors: ['wear', 'wears'] },
    { sentence: 'She\'s ___ a blue dress.', answer: 'wearing', distractors: ['wear', 'wears'] },
    { sentence: 'He\'s wearing ___ hat.', answer: 'a', distractors: ['an', 'some'] },
    { sentence: 'They\'re ___ their socks.', answer: 'wearing', distractors: ['wear', 'wears'] },
    { sentence: 'I\'m wearing ___ jacket.', answer: 'a', distractors: ['an', 'some'] },
    { sentence: 'Look! I\'m ___ new gloves.', answer: 'wearing', distractors: ['wear', 'wears'] },
  ],
  'eng:frase:classroom': [
    { sentence: '___ down, please.', answer: 'Sit', distractors: ['Sun', 'Sad'] },
    { sentence: 'Open your ___, please.', answer: 'book', distractors: ['house', 'dog'] },
    { sentence: '___ your hands, please.', answer: 'Wash', distractors: ['Sing', 'Fly'] },
    { sentence: 'Listen and ___.', answer: 'repeat', distractors: ['eat', 'sleep'] },
    { sentence: 'Please ___ with your pencil.', answer: 'write', distractors: ['eat', 'sleep'] },
    { sentence: '___ up, please.', answer: 'Stand', distractors: ['Sad', 'Sun'] },
  ],
  'eng:frase:where-is:in': [
    { sentence: 'The cat is ___ the house.', answer: 'in', distractors: ['on', 'under'] },
    { sentence: 'The pencil is ___ the schoolbag.', answer: 'in', distractors: ['on', 'under'] },
    { sentence: 'The fish is ___ the bath.', answer: 'in', distractors: ['on', 'under'] },
    { sentence: 'The ruler is ___ the schoolbag.', answer: 'in', distractors: ['on', 'under'] },
    { sentence: 'The dog is ___ the house.', answer: 'in', distractors: ['on', 'under'] },
    { sentence: 'The duck is ___ the bath.', answer: 'in', distractors: ['on', 'under'] },
  ],
  'eng:frase:where-is:on': [
    { sentence: 'The book is ___ the bed.', answer: 'on', distractors: ['in', 'under'] },
    { sentence: 'The schoolbag is ___ the chair.', answer: 'on', distractors: ['in', 'under'] },
    { sentence: 'The hat is ___ the bed.', answer: 'on', distractors: ['in', 'under'] },
    { sentence: 'The pencil is ___ the chair.', answer: 'on', distractors: ['in', 'under'] },
    { sentence: 'The apple is ___ the chair.', answer: 'on', distractors: ['in', 'under'] },
    { sentence: 'The cat is ___ the sofa.', answer: 'on', distractors: ['in', 'under'] },
  ],
  'eng:frase:where-is:under': [
    { sentence: 'The shoes are ___ the bed.', answer: 'under', distractors: ['in', 'on'] },
    { sentence: 'The socks are ___ the sofa.', answer: 'under', distractors: ['in', 'on'] },
    { sentence: 'The frog is ___ the bed.', answer: 'under', distractors: ['in', 'on'] },
    { sentence: 'The key is ___ the door.', answer: 'under', distractors: ['in', 'on'] },
    { sentence: 'The mouse is ___ the bed.', answer: 'under', distractors: ['in', 'on'] },
    { sentence: 'The cat is ___ the bed.', answer: 'under', distractors: ['happy', 'yellow'] },
  ],
  'eng:frase:ive-got': [
    { sentence: 'I ___ got two hands.', answer: 'have', distractors: ['has', 'is'] },
    { sentence: 'She ___ got a nose.', answer: 'has', distractors: ['have', 'is'] },
    { sentence: 'You\'ve ___ a funny nose.', answer: 'got', distractors: ['get', 'gets'] },
    { sentence: 'We ___ got two ears.', answer: 'have', distractors: ['has', 'is'] },
    { sentence: 'It ___ got a big nose.', answer: 'has', distractors: ['have', 'is'] },
    { sentence: 'They\'ve ___ long legs.', answer: 'got', distractors: ['get', 'gets'] },
  ],
  'eng:frase:weather': [
    { sentence: 'It\'s ___ today. The sun is out.', answer: 'sunny', distractors: ['rainy', 'snowy'] },
    { sentence: 'It\'s ___. Take your jacket.', answer: 'cold', distractors: ['hot', 'tall'] },
    { sentence: 'It\'s ___ today. The rain is falling.', answer: 'rainy', distractors: ['sunny', 'hot'] },
    { sentence: 'It is ___ and the clouds are grey.', answer: 'cloudy', distractors: ['sunny', 'hot'] },
    { sentence: 'It\'s ___. There is snow outside.', answer: 'snowy', distractors: ['sunny', 'hot'] },
    { sentence: 'It\'s very ___. Let\'s go swimming.', answer: 'hot', distractors: ['cold', 'rainy'] },
  ],
  'eng:frase:what-day': [
    { sentence: '___ is it today? It is Monday.', answer: 'What', distractors: ['Fly', 'Sit'] },
    { sentence: 'Today is Thursday. Tomorrow is ___.', answer: 'Friday', distractors: ['Sunday', 'Tuesday'] },
    { sentence: 'Monday comes after ___.', answer: 'Sunday', distractors: ['Friday', 'Tuesday'] },
    { sentence: 'July comes after ___.', answer: 'June', distractors: ['August', 'March'] },
    { sentence: 'August comes after ___.', answer: 'July', distractors: ['May', 'March'] },
    { sentence: 'June comes after ___.', answer: 'May', distractors: ['July', 'March'] },
  ],
}
