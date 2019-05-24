/*
 * Copyright 2018-2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

//
// Alexa Fact Skill - Sample for Beginners
//

// sets up dependencies
const Alexa = require('ask-sdk-core');
const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');

function supportsDisplay(handlerInput) {
  var hasDisplay =
    handlerInput.requestEnvelope.context &&
    handlerInput.requestEnvelope.context.System &&
    handlerInput.requestEnvelope.context.System.device &&
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces &&
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces.Display
  return hasDisplay;
}

// core functionality for fact skill
const GetNewFactHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    // checks request type
    return request.type === 'LaunchRequest'
      || (request.type === 'IntentRequest'
        && request.intent.name === 'GetNewFactIntent');
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    // gets a random fact by assigning an array to the variable
    // the random item from the array will be selected by the i18next library
    // the i18next library is set up in the Request Interceptor
    const randomFact = requestAttributes.t('FACTS');
    // concatenates a standard message with the random fact
    const speakOutput = requestAttributes.t('GET_FACT_MESSAGE') + randomFact;
    
    const data = require('./data/main.json');
    const template = require('./templates/main.json');

    if(supportsDisplay(handlerInput))
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .addDirective({
          type: 'Alexa.Presentation.APL.RenderDocument',
          version: '1.0',
          document: template,
          datasources: data
      })
      .getResponse();
      else
      return handlerInput.responseBuilder
      .speak(speakOutput)
      .withSimpleCard(requestAttributes.t('SKILL_NAME'), randomFact)
      .getResponse();

  },
};

const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    return handlerInput.responseBuilder
      .speak(requestAttributes.t('HELP_MESSAGE'))
      .reprompt(requestAttributes.t('HELP_REPROMPT'))
      .getResponse();
  },
};

const FallbackHandler = {
  // The FallbackIntent can only be sent in those locales which support it,
  // so this handler will always be skipped in locales where it is not supported.
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    return handlerInput.responseBuilder
      .speak(requestAttributes.t('FALLBACK_MESSAGE'))
      .reprompt(requestAttributes.t('FALLBACK_REPROMPT'))
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && (request.intent.name === 'AMAZON.CancelIntent'
        || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    return handlerInput.responseBuilder
      .speak(requestAttributes.t('STOP_MESSAGE'))
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);
    console.log(`Error stack: ${error.stack}`);
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    return handlerInput.responseBuilder
      .speak(requestAttributes.t('ERROR_MESSAGE'))
      .reprompt(requestAttributes.t('ERROR_MESSAGE'))
      .getResponse();
  },
};

const LocalizationInterceptor = {
  process(handlerInput) {
    // Gets the locale from the request and initializes i18next.
    const localizationClient = i18n.use(sprintf).init({
      lng: handlerInput.requestEnvelope.request.locale,
      resources: languageStrings,
    });
    // Creates a localize function to support arguments.
    localizationClient.localize = function localize() {
      // gets arguments through and passes them to
      // i18next using sprintf to replace string placeholders
      // with arguments.
      const args = arguments;
      const values = [];
      for (let i = 1; i < args.length; i += 1) {
        values.push(args[i]);
      }
      const value = i18n.t(args[0], {
        returnObjects: true,
        postProcess: 'sprintf',
        sprintf: values,
      });

      // If an array is used then a random value is selected
      if (Array.isArray(value)) {
        return value[Math.floor(Math.random() * value.length)];
      }
      return value;
    };
    // this gets the request attributes and save the localize function inside
    // it to be used in a handler by calling requestAttributes.t(STRING_ID, [args...])
    const attributes = handlerInput.attributesManager.getRequestAttributes();
    attributes.t = function translate(...args) {
      return localizationClient.localize(...args);
    };
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    GetNewFactHandler,
    HelpHandler,
    ExitHandler,
    FallbackHandler,
    SessionEndedRequestHandler,
  )
  .addRequestInterceptors(LocalizationInterceptor)
  .addErrorHandlers(ErrorHandler)
  .withCustomUserAgent('sample/basic-fact/v1')
  .lambda();

// TODO: Replace this data with your own.
// It is organized by language/locale.  You can safely ignore the locales you aren't using.
// Update the name and messages to align with the theme of your skill

const deData = {
  translation: {
    SKILL_NAME: 'Weltraumwissen',
    GET_FACT_MESSAGE: 'Hier sind deine Fakten: ',
    HELP_MESSAGE: 'Du kannst sagen, „Nenne mir einen Fakt über den Weltraum“, oder du kannst „Beenden“ sagen... Wie kann ich dir helfen?',
    HELP_REPROMPT: 'Wie kann ich dir helfen?',
    FALLBACK_MESSAGE: 'Die Weltraumfakten Skill kann dir dabei nicht helfen. Sie kann dir Fakten über den Raum erzählen, wenn du dannach fragst.',
    FALLBACK_REPROMPT: 'Wie kann ich dir helfen?',
    ERROR_MESSAGE: 'Es ist ein Fehler aufgetreten.',
    STOP_MESSAGE: 'Auf Wiedersehen!',
    FACTS:
      [
        'Ein Jahr dauert auf dem Merkur nur 88 Tage.',
        'Die Venus ist zwar weiter von der Sonne entfernt, hat aber höhere Temperaturen als Merkur.',
        'Venus dreht sich entgegen dem Uhrzeigersinn, möglicherweise aufgrund eines früheren Zusammenstoßes mit einem Asteroiden.',
        'Auf dem Mars erscheint die Sonne nur halb so groß wie auf der Erde.',
        'Jupiter hat den kürzesten Tag aller Planeten.',
      ],
  },
};

const dedeData = {
  translation: {
    SKILL_NAME: 'Weltraumwissen auf Deutsch',
  },
};

const enData = {
  translation: {
    SKILL_NAME: 'Football Facts',
    GET_FACT_MESSAGE: 'Here\'s your fact: ',
    HELP_MESSAGE: 'You can say tell me a football fact, or, you can say exit... What can I help you with?',
    HELP_REPROMPT: 'What can I help you with?',
    FALLBACK_MESSAGE: 'The Football Facts skill can\'t help you with that.  It can help you discover facts about football if you say tell me a football fact. What can I help you with?',
    FALLBACK_REPROMPT: 'What can I help you with?',
    ERROR_MESSAGE: 'Sorry, an error occurred.',
    STOP_MESSAGE: 'Goodbye!',
    FACTS:
      [
        'Football was invented in China nearly 476 B.C.',
        'Only Canadians and Americans call football as Soccer.',
        'During every game, Football players run an average of 9.65 km.',
        'The first game of Basketball was played with a soccer ball.',
        'The maximum number of goals ever scored was by Stephan Stanis (France) in December 1942.',
        'Pele was the first to call football "the beautiful game."',
        'The total length of the football field is 100 yards.',
        'One of the fastest goal was in 2.8 seconds made by Ricardo Olivera in December 1998.',
        'In 2002 World Cup, Oliver Kahn became the first and only goalkeeper to win the Golden Ball.',
        'Until 1913, Goalies did not wear different colored shirts from their teammates.',
        'A referee\'s call during a football match in Peru caused a riot that killed over 300 people and injured over 500 people  in 1964.',
        'Most World Cup final reached team are European Teams, except for the finals of 1930 and 1950.',
        'The World’s First Football Club was the English Sheffield Football Club founded in 1857.',
        'Neil Armstrong wanted to take a football to the moon, but NASA refused it.',
        'In 1937, the first live coverage of a football match was shown on television.',
        'Football balls are made from layers of synthetic leather while the bladders inside the ball are made from latex or butyl.',
        'Different shots in soccer are: knuckle shot, the full volley, the half volley, the swerve shot,  the side volley and the flying volley.',
        'Different positions in the Football field are: center-back, sweeper, goalkeeper,  fullback, wingback, attacking midfielder, winger, forward, striker, center-midfielder, defensive midfielder and stopper.',
        'The highest goals were 149-0 in a football game played between Stade Olympique de L’emyrne and AS Adema of Madagascar.',
        'Lionel Messi is the player to score most in a calender year with 91 goals',
        'The largest Football tournament saw no less than 5,098 teams. They competed in 1999 for the second Bangkok League Seven-a-Side Competition. Over 35,000 players participated.',
        'A total of 20 red cards were shown in a match played between Sportivo Ameliano and General Caballero in Paraguay.',
        'In 1998, lightening killed an entire football team. The catastrophe occurred in Congo during a match between the villages of Bena Tshadi and nearby Basangana.',
        'In 1950 India withdrew from World Cup because they were not allowed to play barefoot by FIFA.',
        'The number of players contesting a penalty shoot out has to be the same, so if one player gets a red card another player from the other team has to sit out the shootout',
        'Ballon d\'Or winner, Cristiano Ronaldo was the first player to score a goal in every minute of the game'
      ],
  },
};

const enauData = {
  translation: {
    SKILL_NAME: 'Australian Space Facts',
  },
};

const encaData = {
  translation: {
    SKILL_NAME: 'Canadian Space Facts',
  },
};

const engbData = {
  translation: {
    SKILL_NAME: 'British Space Facts',
  },
};

const eninData = {
  translation: {
    SKILL_NAME: 'Football Facts',
  },
};

const enusData = {
  translation: {
    SKILL_NAME: 'American Space Facts',
  },
};

const esData = {
  translation: {
    SKILL_NAME: 'Curiosidades del Espacio',
    GET_FACT_MESSAGE: 'Aquí está tu curiosidad: ',
    HELP_MESSAGE: 'Puedes decir dime una curiosidad del espacio o puedes decir salir... Cómo te puedo ayudar?',
    HELP_REPROMPT: 'Como te puedo ayudar?',
    FALLBACK_MESSAGE: 'La skill Curiosidades del Espacio no te puede ayudar con eso.  Te puede ayudar a descubrir curiosidades sobre el espacio si dices dime una curiosidad del espacio. Como te puedo ayudar?',
    FALLBACK_REPROMPT: 'Como te puedo ayudar?',
    ERROR_MESSAGE: 'Lo sentimos, se ha producido un error.',
    STOP_MESSAGE: 'Adiós!',
    FACTS:
        [
          'Un año en Mercurio es de solo 88 días',
          'A pesar de estar más lejos del Sol, Venus tiene temperaturas más altas que Mercurio',
          'En Marte el sol se ve la mitad de grande que en la Tierra',
          'Jupiter tiene el día más corto de todos los planetas',
          'El sol es una esféra casi perfecta',
        ],
  },
};

const esesData = {
  translation: {
    SKILL_NAME: 'Curiosidades del Espacio para España',
  },
};

const esmxData = {
  translation: {
    SKILL_NAME: 'Curiosidades del Espacio para México',
  },
};

const frData = {
  translation: {
    SKILL_NAME: 'Anecdotes de l\'Espace',
    GET_FACT_MESSAGE: 'Voici votre anecdote : ',
    HELP_MESSAGE: 'Vous pouvez dire donne-moi une anecdote, ou, vous pouvez dire stop... Comment puis-je vous aider?',
    HELP_REPROMPT: 'Comment puis-je vous aider?',
    FALLBACK_MESSAGE: 'La skill des anecdotes de l\'espace ne peux vous aider avec cela. Je peux vous aider à découvrir des anecdotes sur l\'espace si vous dites par exemple, donne-moi une anecdote. Comment puis-je vous aider?',
    FALLBACK_REPROMPT: 'Comment puis-je vous aider?',
    ERROR_MESSAGE: 'Désolé, une erreur est survenue.',
    STOP_MESSAGE: 'Au revoir!',
    FACTS:
        [
          'Une année sur Mercure ne dure que 88 jours.',
          'En dépit de son éloignement du Soleil, Vénus connaît des températures plus élevées que sur Mercure.',
          'Sur Mars, le Soleil apparaît environ deux fois plus petit que sur Terre.',
          'De toutes les planètes, Jupiter a le jour le plus court.',
          'Le Soleil est une sphère presque parfaite.',
        ],
  },
};

const frfrData = {
  translation: {
    SKILL_NAME: 'Anecdotes françaises de l\'espace',
  },
};

const itData = {
  translation: {
    SKILL_NAME: 'Aneddoti dallo spazio',
    GET_FACT_MESSAGE: 'Ecco il tuo aneddoto: ',
    HELP_MESSAGE: 'Puoi chiedermi un aneddoto dallo spazio o puoi chiudermi dicendo "esci"... Come posso aiutarti?',
    HELP_REPROMPT: 'Come posso aiutarti?',
    FALLBACK_MESSAGE: 'Non posso aiutarti con questo. Posso aiutarti a scoprire fatti e aneddoti sullo spazio, basta che mi chiedi di dirti un aneddoto. Come posso aiutarti?',
    FALLBACK_REPROMPT: 'Come posso aiutarti?',
    ERROR_MESSAGE: 'Spiacenti, si è verificato un errore.',
    STOP_MESSAGE: 'A presto!',
    FACTS:
      [
        'Sul pianeta Mercurio, un anno dura solamente 88 giorni.',
        'Pur essendo più lontana dal Sole, Venere ha temperature più alte di Mercurio.',
        'Su Marte il sole appare grande la metà che su la terra. ',
        'Tra tutti i pianeti del sistema solare, la giornata più corta è su Giove.',
        'Il Sole è quasi una sfera perfetta.',
      ],
  },
};

const ititData = {
  translation: {
    SKILL_NAME: 'Aneddoti dallo spazio',
  },
};

const jpData = {
  translation: {
    SKILL_NAME: '日本語版豆知識',
    GET_FACT_MESSAGE: '知ってましたか？',
    HELP_MESSAGE: '豆知識を聞きたい時は「豆知識」と、終わりたい時は「おしまい」と言ってください。どうしますか？',
    HELP_REPROMPT: 'どうしますか？',
    ERROR_MESSAGE: '申し訳ありませんが、エラーが発生しました',
    STOP_MESSAGE: 'さようなら',
    FACTS:
      [
        '水星の一年はたった88日です。',
        '金星は水星と比べて太陽より遠くにありますが、気温は水星よりも高いです。',
        '金星は反時計回りに自転しています。過去に起こった隕石の衝突が原因と言われています。',
        '火星上から見ると、太陽の大きさは地球から見た場合の約半分に見えます。',
        '木星の<sub alias="いちにち">1日</sub>は全惑星の中で一番短いです。',
        '天の川銀河は約50億年後にアンドロメダ星雲と衝突します。',
      ],
  },
};

const jpjpData = {
  translation: {
    SKILL_NAME: '日本語版豆知識',
  },
};

const ptbrData = {
  translation: {
    SKILL_NAME: 'Fatos Espaciais',
  },
};

const ptData = {
  translation: {
    SKILL_NAME: 'Fatos Espaciais',
    GET_FACT_MESSAGE: 'Aqui vai: ',
    HELP_MESSAGE: 'Você pode me perguntar por um fato interessante sobre o espaço, ou, fexar a skill. Como posso ajudar?',
    HELP_REPROMPT: 'O que vai ser?',
    FALLBACK_MESSAGE: 'A skill fatos espaciais não tem uma resposta para isso. Ela pode contar informações interessantes sobre o espaço, é só perguntar. Como posso ajudar?',
    FALLBACK_REPROMPT: 'Eu posso contar fatos sobre o espaço. Como posso ajudar?',
    ERROR_MESSAGE: 'Desculpa, algo deu errado.',
    STOP_MESSAGE: 'Tchau!',
    FACTS:
      [
        'Um ano em Mercúrio só dura 88 dias.',
        'Apesar de ser mais distante do sol, Venus é mais quente que Mercúrio.',
        'Visto de marte, o sol parece ser metade to tamanho que nós vemos da terra.',
        'Júpiter tem os dias mais curtos entre os planetas no nosso sistema solar.',
        'O sol é quase uma esfera perfeita.',
      ],
  },
};

// constructs i18n and l10n data structure
const languageStrings = {
  'de': deData,
  'de-DE': dedeData,
  'en': enData,
  'en-AU': enauData,
  'en-CA': encaData,
  'en-GB': engbData,
  'en-IN': eninData,
  'en-US': enusData,
  'es': esData,
  'es-ES': esesData,
  'es-MX': esmxData,
  'fr': frData,
  'fr-FR': frfrData,
  'it': itData,
  'it-IT': ititData,
  'ja': jpData,
  'ja-JP': jpjpData,
  'pt': ptData,
  'pt-BR': ptbrData,
};
