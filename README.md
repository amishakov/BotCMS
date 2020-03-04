# BotCMS
## Описание
Система управления для создания чат-ботов.  
Позволяет поддерживать неограниченное количество ботов в рамках одного приложения
на любых площадках. "Из коробки" поддерживаются Telegram и ВКонтакте, любые другие
возможно подключить путем написания "драйверов", выполняющих роль транспорта.

### Взаимодействие с MVLoader
**BotCMS** - самодостаточный пакет, ниже находится полное описание. Однако, максимальные возможности раскрываются при его
использовании как части проекта на базе [MVLoader](https://www.npmjs.com/package/mvloader) с помощью пакета [mvl-botcms-handler](https://www.npmjs.com/package/mvl-botcms-handler).

Связанные с **BotCMS** пакеты, работающие через **MVLoader**:
1. [botcms-users](https://www.npmjs.com/package/botcms-users)
1. [mvl-botcms-handler](https://www.npmjs.com/package/mvl-botcms-handler)
2. [mvl-db-bot-controller](https://www.npmjs.com/package/mvl-db-bot-controller)
2. [mvl-botcms-common-semis](https://www.npmjs.com/package/mvl-botcms-common-semis)
2. [mvl-handlebars-handler](https://www.npmjs.com/package/mvl-handlebars-handler)

## Возможности
* Настройка ботов через простые YAML или JSON файлы (схемы);
* Использование пользовательский методов, если недостаточно встроенных проверок/действий;
* Поддержка мультиязычности
* Поддержка клавиатур
* Сборка полной схемы из неограниченного количества файлов с возможностью переопределения в порядке загрузки файлов

# Установка
$ npm install botcms --save

# Быстрый старт
Ниже пример простейшего бота, который в Telegram здоровается при получении сообщения "/start" и отправляет предложение помощи в ответ на любое другое сообщение.

**index.js**
```
const BotCMS = require('botcms');
const MVTools = require('mvtools');

let config = {
    networks: [
        {
            name: 'tg',
            token: '<TELEGRAM BOT TOKEN>'
        }
    ],
    defaults: {
        action: 'help'
    }
};
let schema = {
    scripts: {
        c: {
            help: {
                message: 'Я - великий бот-помощник! Я выполню все твои задачи! Но пока умею отвечать только на команду /start :)',
                command: true
            },
            all: {
                trigger: '/start',
                message: 'Привет!',
                command: true
            }
        }
    }
};

let bot = new BotCMS(config);
// Загрузка схемы - готовый объект или путь к файлу
bot.loadSchema(schema)
    .then(() => bot.init())
    .then(async () => await bot.launch());
```

# Настройка
При создании нового экземпляра ему передается конфигурационный объект. 
Ключевые элементы:
* classes - объект с загруженными дополнительными классами. Подробнее в соответствующем разделе;
* db - параметры конфигурации базы данных;
* drivers - объект с драйверами социальных платформ;
* networks - массив объектов с параметрами подключения каждого бота;
* middlewares - массив middlewares;
* language - язык при отсутствии явного выбора пользователя. По умолчанию - en.


# Схема
Из схемы бот узнает, как обрабатывать сообщения, какие задания выполнять по расписанию,
какими фразами отвечать, и многое другое.  
В примерах ниже используется формат _YAML_. Вместо _YAML_ может использоваться _JSON_ или объект _JavaScript_.

## Общие положения
### Имена методов
Все методы указываются относительно глобального объекта process. Таким образом, для успешного выполнения метода 
**controllerName.methodName** должен существовать метод **process.controllerName.methodName**.

### Файлы схемы
При загрузке схема обходится рекурсивно. При обнаружении в любом месте схемы инструкции **"$FILE path/to/file"**
подгружается файл по указанному пути и сохраняется в соответствующем месте схемы.  

#### Пример корневого файла
Файл схемы может быть как единственным (полным), так и составным. Пример корневого файла, 
на основе которого составляется полная схема:
```
scripts: $FILE ./include/scripts.yml
lexicons: $FILE ./include/lexicons.yml
keyboards: $FILE ./include/keyboards.yml
cron: $FILE ./include/cron.yml
config: $FILE ./include/config.yml
```

## Разделы схемы
* scripts - дерево "вопросов" и "ответов"
* lexicons - записи словарей
* cron - задания для выполнения по расписанию
* keyboards - готовые "клавиатуры"
* config - конфигурация

### scripts

Скрипты в схеме образуют дерево неограниченной вложенности. 

Дочерние элементы узла находятся в элементе **.c**. Пример:
```
c:
  start:
    trigger: /start
    message: Start
  parent:
    trigger: parent
    c:
      child1:
        message: Child1
      child2:
        message: Child2
``` 

#### Элементы узлов
Ни один из элементов не является обязательным.

##### command
Определяет, является ли узел командой. Отличие команд от обычных узлов в том, 
что они доступны для вызова в любой момент, независимо от текущего местонахождения пользователя.
 
Возможное значение: **true** 

##### trigger
Условие, по которому узел считается подходящим под введенное пользователем сообщение.
Если trigger является строкой, он преобразуется к объекту:
```
trigger: 
  value: User message
```
Элементы объекта:
* type - тип проверки. Если отсутствует, считается текстом. Возможные значения:
  * regexp - регурярное выражение
  * text, method - название метода, запись словаря, текст. Независимо от значения type,
  проверка проходит именно в таком порядке. 
  * bridge - название социальной сети (транспорта), для которого актуален данный узел
* value - значение. Если указан массив значений, проверка производится до первого совпадения.

Важно: **trigger** может быть массивом объектов указанной структуры. В таком случае 
для успешного прохождения проверки все элементы массива должны дать положительный результат.

Пример расширенного **trigger**:

```
trigger:
  - type: method
    value: controllerName.methodName
  - - /start
    - Начать
    - path.of.lexicon.entry
```

##### message
Отправляемое пользователю сообщение.
Может быть:
* названием метода
* записью словаря
* текстом

##### action
Может быть как строкой, так и объектом. Если строка, преобразуется в объект:
```
action:
  type: method
  name: methodName
``` 
Обрабатываемые ключи объекта:
* **type** - тип действия. Поддерживаемые: 
  * **method** - выполнение метода
  * **send** - отправка сообщения 
* **name** - имя метода
* **params** - Набор параметров

###### Параметры для method
Объект (строка, массив) параметров будет передан в вызываемый метод в неизменном виде

###### Параметры для send
* **message** - отправляемое сообщение
* **from_scope** - ветка сохраненных ответов пользователя
* **target** - объект вида:
  ```
  bridgeName:
    - peerId1
    - peerId2
  ```
  
#### keyboard
Объект клавиатуры. Подробнее в разделе **"scripts" - "keyboards"**

#### keyboard_name
Название готовой клавиатуры. Если найдена в готовых, заменяет собой обозначенный выше объект клавиатуры. 

#### goto
Адрес узла для принудительного перехода.
Поддерживает следующие подстановки:
* **((self))** - текущий узел
* **((parent))** - родитель текущего узла
* **((grandpa))** - "дедушка" текущего узла
* **((children))** - элемент _".c"_ текущего узла

#### store и store_pre
Сохранение значений в сессию.
* **store_pre** - сохранение значения из value сразу при попадании в узел, еще до отправки пользователю сообщения или 
выполнения действия
* **store** - сохранение полученного в текущем узле ответа пользователя. Если значение указано в _value_, оно является 
приоритетным.

Структура одинакова в обоих случаях:
* **thread** - название объекта, в котором сохраняются значения. Если не указано, используется название первого корневого 
узла текущей ветки;
* **key** - ключ значения в объекте. Если не указан, используется числовой на 1 больше общего количества элементов 
в объекте;
* **value** - сохраняемое значение. Если не указано, используется полученное от пользователя сообщение. Если нет и его, 
используется пустая строка;
* **clear** - инструкция для очистки текущей ветки. Обычно используется при сохранении первого ответа для удаления 
полученных ответов ранее. 

#### с
Дочерние узлы.  
Все дочерние узлы имеют одинаковую структуру.

###### Пример
```
node: 
  trigger: /node
  message: parent node
  c:
    childNode1:
      trigger: /node
      message: parent node
    childNode2:
      trigger: /node
      message: parent node
```

##### validate
Правила проверки ответа пользователя и последующих действий.
Элементы:
* **validator** - тип проверки. Если отсутствует, любой ответ считается правильным. 
Может быть именем метода для проверки или одним из предустановленных вариантов ответа:
  * _text_ - полученное сообщение является строкой. Фактически, можно не указывать;
  * _email_ - полученное сообщение является корректным email-адресом;
  * _number_ - полученное сообщение является числом;
  * _photo_ - в сообщении присутствует фото;
* **params** - параметры для валидатора. Актуально для методов или встроенных проверок в будущем;
* **failure** - действие при неуспешной проверке;
* **switch** - выбор действия при успешной проверке;
* **success** - действие при успешной проверке, если не найдено по условию в switch. Объект, ключи которого сравниваются с полученным сообщением.

###### Структура объектов действия
Под объектом действия подразумеваются элементы **failure**, **success**, вложенные в **switch**.  
Структура:
* **goto** - путь следующего узла для перехода
* **help** - путь узла помощи. Он выполняется, но пользователь не перемещается в него. Удобно при неуспешных 
проверках для отображения подсказки пользователю.

Поддерживается сокращенный формат, когда вместо объекта указывается сразу путь в виде строки. В таком случае
строка обрабатывается аналогично следующему полному объекту:
```
success:
  goto: path.to.next.node
```

Подстановки для элементов goto и help описаны выше.

###### Пример
```
validate:
  validator: controllerName.methodName
  params: 
    key1: val1
    key2: val2
  failure:
    help: c.help_hint
    goto: ((parent)).next
  switch: 
    text1: ((grandpa))
    "controllerName2.methodName2": ((children))
    "path.from.lexicon":
      help: ((parent)).help_hint2
      goto: ((parent)).prev
  success: c.path.to.success.node
```


### lexicons
Словари для мультиязычности.  
На корневом уровне обозначение языка. Далее - записи с любым уровнем вложенности без ограничений по структуре.

Пример:
```
ru: 
  common:
    hello: Привет
    help: Помощь
  message: Простое сообщение
en: 
  common:
    hello: Hello
    help: Help
```

Пример пути записи словаря:
```common.hello```

### keyboards
Список готовых объектов клавиатур. 
Элементы подробно описаны в разделе **"Служебные классы" - "Keyboard" - "kbObject"**.

### cron
Список заданий. Расписание указывается в стандартном для cron формате, но с учетом секунд.
То есть, на 1 параметр больше.

Пример отправки сообщения в чат каждый час: 
```
cron:
  task1:
    trigger: 0 0 * * * 
    action: methodName      
```
Инструкции для работы находятся в ключе **action**. Подробнее - в разделе **"scripts" - "action"**.

### config
Все указанное в данном разделе будет слито с конфигом бота, задаваемым при его создании. 

# База данных
На текущий момент в **BotCMS** БД поддерживается через [typeORM](https://www.npmjs.com/package/typeorm), но данная связь 
является устаревшей. В течение некоторого времени она будет будет полностью устранена, а **typeORM** исключен 
из зависимостей.

Для работы непосредственно **BotCMS** БД не требуется, она необходима только для пользовательских методов и middlewares. 
Для них рекомендуется использовать [mvl-db-handler](https://www.npmjs.com/package/mvl-db-handler), предоставляющий 
интерфейс к БД на основе [Sequelize](https://www.npmjs.com/package/sequelize).

# Служебные классы

## Context
Контекст - сеанс работы с одним полученным сообщением. 
При обработке сообщения объект context (ctx) необходимо передавать между всеми методами. 

Свойства класса:
* **Bridge** - экземпляр драйвера социальной платформы, через который получено сообщение;
* **Message** - объект нормализованного полученного сообщения. Подробнее ниже;
* **context** - объект контекста из драйвера социальной платформы;
* **session** - объект для долговременного хранения данных, сессия. Является отражением сессии из драйвера;
* **singleSession** - объект для кратковременного хранения данных. Исчезает после завершения обработки сообщения;
* **language** - пользовательский язык, сохраненный в сессии. При отсутствии используется язык по умолчанию из конфигурации 
BotCMS; 
* **isProcessed** - флаг, отражающий факт обработки сообщения. Изменяется, как правило, в middlewares для исключения 
отправки пользователю сообщения с подказкой, если по схеме не найден новый узел.

Методы класса:
* **reply(Parcel)** - отправка ответа пользователю в тот же чат/диалог, из которого получен ответ. Параметр Parcel может 
быть как экземпляром класса Parcel, так и строкой. Строки, поступающие параметрами в reply, отправляются пользователю 
без преобразований. Если требуется преобразовать ее через словарь, предварительно используйте метод lexicon(). 
Указанный в Parcel **peerId** будет перезаписан ID чата, из которого получено текущее обрабатываемое сообщение;
* **lexicon(string)** - преобразование входящей строки через словарь с учетом выбранного пользователем языка;
* **setProcessed(state)** - выставление состояния обработанности контекста. Тип параметра - _boolean_. 

## Message
Объект одного входящего сообщения.

Свойства класса:
* **id** - ID полученного сообщения в социальной платформе;
* **text** - текст полученного сообщения; 
* **chat** - информация о чате, в котором получено сообщение;
  * **id** - ID чата в социальной платформе;
  * **type** - тип чата. Возможные значения:
    * _user_ - диалог;
    * _group_ - групповой чат;
* **sender** - информация об отправителе;
  * **id** - ID отправителя в социальной платформе;
  * **username** - имя пользователя;
  * **isBot** - флаг, является ли отправитель ботом; 
* **reply** - информация о сообщении, ответом на которое является текущее
  * **id** - ID сообщения в социальной платформе;
  * **chatId** - ID чата в социальной платформе;
  * **senderId** - ID отправителя в социальной платформе;
  * **text** - текст сообщения;
* **attachments** - объект с полученными вложениями. Элементами являются значения массива **ATTACHMENTS** из экземпляра **BotCMS**.

Методы класса:
* **handleAttachment(props)** - прикрепление вложения. Параметр должен быть объектом. Ключи, не являющиеся значениями 
массива **ATTACNMENTS** из экземпляра **BotCMS**, игнорируются.

## Keyboard
Конструктор клавиатуры.
Используется для удобного построения отправляемой клавиатуры в пользовательских методах.
 
Свойства класса:
* **buttons** - массив кнопок. Аналогичен таковому в схеме;
* **options** - массив опций. Аналогичен таковому в схеме;

Методы класса:
* **build()** - собрать клавиатуру для отправки;
* **fromkBObject(kbObject)** - загрузить клавиатуру из объекта;
* **clear(clear = true)** - очистка клавиатуры у пользователя;
* **addBtnFromArray(kbArray = [])** - добавление нескольких строк с кнопками. Параметр - массив строк-заголовков. Строки могут быть текстом,
записями словаря, названиями методов;
* **addBtnRow(captions)** - добавление строки с кнопками. Параметр - массив строк-заголовков. Строки могут быть текстом,
записями словаря, названиями методов;
* **addBtn(caption)** - добавление 1 кнопки на строку. Параметр - строка-заголовок кнопки. Строки может быть текстом,
записью словаря, названием метода;
* **addBtnMenuMain()** - добавить кнопку "Главное меню";
* **addBtnMenuManage()** - добавить кнопку "Управление"; 
* **addBtnBack()** - добавить кнопку "Назад;";
* **addBtnDel()** - добавить кнопку "Удалить".

Все методы возвращают экземпляр конструктора, что позволяет вызывать их по цепочке.

При создании нового экземпляра ему необходимо передать:
* объект **Context** - контекст обрабатываемого сообщения;
* объект **kbObject** - описание ниже. 
  
### kbObject
Элементы объекта (ни один не является обязательным):
* **method** - имя метода, возвращающего объект клавиатуры **kbObject**. Если в полученном объекте снова будет 
  элемент **method**, он будет проигнорирован;
* **buttons** - массив кнопок. Одномерный, если во всех строках только по одной кнопке. Двумерный, если хотя бы в одной 
строке более 1 кнопки; 
* **options** - масссив опций. Поддерживаемые опции (не во всех социальных платформах одинаково поддерживаются):
  * _oneTime_ - скрыть клавиатуру после любого ввода пользователя;
  * _resize_ - изменить размер области кнопок до минимального;
  * _simple_ - простая клавиатура в нижней части экрана вместо системной клавиатуры; 
* **clear** - флаг, означающий удаление имеющейся клавиатуры у пользователя. Если установлен, все остальные свойства 
при сборке будут проигнорированиы

### Примеры
```
let kb = new Bot.config.classes.Keyboard();
let builtKb = kb.addBtnMenuMain().build();

let builtKb2 = new Bot.config.classes.Keyboard(
    {buttons: [['Button text', 'Button text2'], ['Button text2']]
}).addBtnMenuManage(),addBtnMenuMain().build();

let noKb = Bot.config.classes.Keyboard().clear().build();
```


## Parcel 
Класс посылки с данными, отправляемыми пользователю. 

Свойства класса:
* **message** - текст сообщения;
* **peerId** - ID чата, куда будет отправлено сообщение;
* **keyboard** - собранный объект клавиатуры;
* **attachments** - объект с вложениями. Элементами являются значения массива **ATTACHMENTS** из экземпляра **BotCMS**. 
Значения элементов - массивы.

При создании нового экземпляра посылки можно передать текст сообщения или объект, свойства которого будут записаны как 
свойства посылки. 

## Scripts
Класс для хранения и обработки дерева скриптов, по которому бот сопровождает пользователя.

Методы класса:
* **load(scripts)** - загрузка дерева скриптов. Новое дерево совмещается с загруженным ранее;
* **extract(path)** - получение ветки скриптов по адресу.
