/* Frases de Inglés de 3.º para `eng-complete` (eng:frase:*): seis frases originales por tema, en inglés británico. Cada
   frase tiene un hueco («___») y tres opciones: la respuesta y dos distractores de la MISMA clase (preposiciones con
   preposiciones, verbos con verbos, tiempo con tiempo…), que no sirven en ese hueco. Cuando un distractor de la misma clase
   podría encajar, la frase lleva una pista en español (`es`, sin la respuesta) que decide. Los sustantivos salen de
   ENGLISH_WORDS. Las ideas de las pistas son generales: no nombran ninguna respuesta. */

export interface PhraseItem {
  /** The sentence with one gap written «___». */
  sentence: string
  answer: string
  /** Two wrong words for the gap, of the same word class as the answer. */
  distractors: [string, string]
  /** A short Spanish cue (Spain) shown above the sentence; it never contains the answer. */
  es?: string
}

/** The first hint of each phrase topic: the idea, in Spanish, never the answer. */
export const PHRASE_IDEAS: Record<string, string> = {
  'eng:frase:saludos': 'Piensa en cómo se saluda o se despide, y en la hora del día.',
  'eng:frase:its-a': 'Fíjate en el animal: cómo es, qué sonido hace o qué puede hacer.',
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
    { sentence: '___, Mum! How are you?', answer: 'Hello', distractors: ['Goodbye', 'Sorry'] },
    { sentence: '___, Dad. See you later!', answer: 'Goodbye', distractors: ['Hello', 'Please'], es: 'Adiós, papá. Hasta luego.' },
    { sentence: 'Thank ___ for the cake, Mum!', answer: 'you', distractors: ['me', 'them'], es: 'Gracias por la tarta, mamá.' },
    { sentence: 'It is ___ to meet you.', answer: 'nice', distractors: ['sad', 'angry'] },
    { sentence: 'How ___ you?', answer: 'are', distractors: ['is', 'am'] },
    { sentence: 'Good ___, Mum! Let\'s eat some bread.', answer: 'morning', distractors: ['night', 'afternoon'], es: 'Buenos días, mamá. Vamos a comer pan.' },
  ],
  'eng:frase:its-a': [
    { sentence: 'A mouse is very ___.', answer: 'small', distractors: ['big', 'tall'], es: 'Un ratón es muy pequeño.' },
    { sentence: 'An elephant is ___ than a mouse.', answer: 'bigger', distractors: ['smaller', 'lighter'], es: 'Un elefante es más grande que un ratón.' },
    { sentence: 'It is a cow. It says ___.', answer: 'moo', distractors: ['woof', 'meow'] },
    { sentence: 'It is a fish. It can ___.', answer: 'swim', distractors: ['fly', 'walk'] },
    { sentence: 'It is a bird. It can ___ high.', answer: 'fly', distractors: ['sleep', 'swim'] },
    { sentence: 'It is a dog. It says ___.', answer: 'woof', distractors: ['moo', 'meow'] },
  ],
  'eng:frase:this-is-my': [
    { sentence: 'This ___ my dad.', answer: 'is', distractors: ['am', 'are'] },
    { sentence: 'This is my ___. She is my mum\'s mum.', answer: 'grandma', distractors: ['baby', 'brother'] },
    { sentence: 'This is my ___. He has got a red hat.', answer: 'brother', distractors: ['sister', 'grandma'] },
    { sentence: 'This is my ___. He is my dad\'s dad.', answer: 'grandpa', distractors: ['baby', 'sister'] },
    { sentence: 'This is my ___. He is very little.', answer: 'baby', distractors: ['mum', 'grandma'] },
    { sentence: 'This is my ___. She cooks in our house.', answer: 'mum', distractors: ['grandpa', 'baby'] },
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
    { sentence: 'Can I ___ some milk, please?', answer: 'have', distractors: ['swim', 'sleep'] },
    { sentence: 'Can I have ___ apple, please?', answer: 'an', distractors: ['a', 'some'] },
    { sentence: 'I am thirsty. Can I have some ___?', answer: 'milk', distractors: ['bread', 'cheese'] },
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
    { sentence: '___ down, please.', answer: 'Sit', distractors: ['Wash', 'Sing'] },
    { sentence: 'Open your ___ and read, please.', answer: 'book', distractors: ['pencil', 'ruler'] },
    { sentence: '___ your hands, please.', answer: 'Wash', distractors: ['Sing', 'Fly'] },
    { sentence: 'Listen and ___.', answer: 'repeat', distractors: ['eat', 'sleep'] },
    { sentence: 'Please ___ with your pencil.', answer: 'write', distractors: ['eat', 'sleep'] },
    { sentence: '___ up, please.', answer: 'Stand', distractors: ['Sing', 'Sleep'] },
  ],
  'eng:frase:where-is:in': [
    { sentence: 'The cat is ___ the house.', answer: 'in', distractors: ['on', 'under'], es: 'El gato está dentro de la casa.' },
    { sentence: 'The pencil is ___ the schoolbag.', answer: 'in', distractors: ['on', 'under'], es: 'El lápiz está dentro de la mochila.' },
    { sentence: 'The fish is ___ the bath.', answer: 'in', distractors: ['on', 'under'], es: 'El pez está dentro de la bañera.' },
    { sentence: 'The ruler is ___ the schoolbag.', answer: 'in', distractors: ['on', 'under'], es: 'La regla está dentro de la mochila.' },
    { sentence: 'The dog is ___ the house.', answer: 'in', distractors: ['on', 'under'], es: 'El perro está dentro de la casa.' },
    { sentence: 'The duck is ___ the bath.', answer: 'in', distractors: ['on', 'under'], es: 'El pato está dentro de la bañera.' },
  ],
  'eng:frase:where-is:on': [
    { sentence: 'The book is ___ the bed.', answer: 'on', distractors: ['in', 'under'], es: 'El libro está encima de la cama.' },
    { sentence: 'The schoolbag is ___ the chair.', answer: 'on', distractors: ['in', 'under'], es: 'La mochila está encima de la silla.' },
    { sentence: 'The hat is ___ the bed.', answer: 'on', distractors: ['in', 'under'], es: 'El sombrero está encima de la cama.' },
    { sentence: 'The pencil is ___ the chair.', answer: 'on', distractors: ['in', 'under'], es: 'El lápiz está encima de la silla.' },
    { sentence: 'The apple is ___ the chair.', answer: 'on', distractors: ['in', 'under'], es: 'La manzana está encima de la silla.' },
    { sentence: 'The cat is ___ the sofa.', answer: 'on', distractors: ['in', 'under'], es: 'El gato está encima del sofá.' },
  ],
  'eng:frase:where-is:under': [
    { sentence: 'The shoes are ___ the bed.', answer: 'under', distractors: ['in', 'on'], es: 'Los zapatos están debajo de la cama.' },
    { sentence: 'The socks are ___ the sofa.', answer: 'under', distractors: ['in', 'on'], es: 'Los calcetines están debajo del sofá.' },
    { sentence: 'The frog is ___ the bed.', answer: 'under', distractors: ['in', 'on'], es: 'La rana está debajo de la cama.' },
    { sentence: 'The key is ___ the door.', answer: 'under', distractors: ['in', 'on'], es: 'La llave está debajo de la puerta.' },
    { sentence: 'The mouse is ___ the sofa.', answer: 'under', distractors: ['in', 'on'], es: 'El ratón está debajo del sofá.' },
    { sentence: 'The cat is ___ the bed.', answer: 'under', distractors: ['in', 'on'], es: 'El gato está debajo de la cama.' },
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
    { sentence: 'It\'s ___ today. The sun is out.', answer: 'sunny', distractors: ['rainy', 'snowy'], es: 'Hoy hace sol.' },
    { sentence: 'It\'s ___. Take your jacket.', answer: 'cold', distractors: ['hot', 'sunny'], es: 'Hace frío. Ponte la chaqueta.' },
    { sentence: 'It\'s ___ today. The rain is falling.', answer: 'rainy', distractors: ['sunny', 'hot'], es: 'Hoy llueve mucho.' },
    { sentence: 'It is ___ and the clouds are grey.', answer: 'cloudy', distractors: ['sunny', 'snowy'], es: 'Hoy está nublado.' },
    { sentence: 'It\'s ___. There is snow outside.', answer: 'snowy', distractors: ['sunny', 'windy'], es: 'Hoy nieva.' },
    { sentence: 'It\'s very ___. Let\'s go swimming.', answer: 'hot', distractors: ['cold', 'rainy'], es: 'Hace mucho calor. ¡Vamos a nadar!' },
  ],
  'eng:frase:what-day': [
    { sentence: '___ is it today? It is Monday.', answer: 'What', distractors: ['Who', 'Where'] },
    { sentence: 'Today is Thursday. Tomorrow is ___.', answer: 'Friday', distractors: ['Sunday', 'Tuesday'] },
    { sentence: 'Monday comes after ___.', answer: 'Sunday', distractors: ['Friday', 'Tuesday'] },
    { sentence: 'July comes after ___.', answer: 'June', distractors: ['August', 'March'] },
    { sentence: 'June comes after ___.', answer: 'May', distractors: ['July', 'March'] },
    { sentence: 'August comes after ___.', answer: 'July', distractors: ['May', 'March'] },
  ],
}
