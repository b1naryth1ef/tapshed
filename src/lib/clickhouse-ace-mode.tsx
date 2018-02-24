import 'brace/mode/java';

const TextHighlightRules = (window as any).ace.acequire('ace/mode/text_highlight_rules').TextHighlightRules;
const TextMode = (window as any).ace.acequire('ace/mode/text').Mode;

export class ClickhouseHighlightRules extends (TextHighlightRules as { new(): any; }) {
  constructor() {
    super();

    const builtinFunctions = (
      'sum|sumIf|avg|avgIf'
    );

    const keywords = (
      'SELECT|CASE|THEN|DISTINCT|INSERT|UPDATE|DELETE|WHERE|AND|OR|OFFSET|HAVING|AS|FROM|' +
      'WHEN|ELSE|END|TYPE|LEFT|RIGHT|JOIN|ON|OUTER|DESC|ASC|UNION|CREATE|TABLE|PRIMARY|KEY|' +
      'FOREIGN|NOT|REFERENCES|DEFAULT|INNER|CROSS|NATURAL|DATABASE|DROP|GRANT|' +
      'ANY|BETWEEN|ATTACH|DETACH|CAST|WITH|BIT_AND|BIT_OR|TO|BIT_XOR|DESCRIBE|OPTIMIZE|' +
      'PREWHERE|TOTALS|DATABASES|PROCESSLIST|SHOW|IF'
    );

    const keywordRegex = (
      'GROUP\\W+BY|ON\\W+CLUSTER|ORDER\\W+BY|LIMIT\\W+\\d+\\W*\,\\W*\\d+|' +
      'LIMIT\\W+\\d+\\W+BY\\W+|LIMIT\\W+\\d+'
    );

    const keywordMapper = this.createKeywordMapper(
      {
        'support.function': builtinFunctions,
        'keyword': keywords,
      },
      'identifier',
      true
    );

    this.$rules = {
      'start': [
        {
          token: 'comment',
          regex: '--.*$',
          caseInsensitive: true,
        },
        {
          token: 'comment',
          start: '/\\*',
          end: '\\*/',
        },
        {
          token: 'constant',
          regex: '".*?',
        },
        {
          token: 'string',
          regex: '\'.*?\'',
        },
        {
          token: 'comment.block',
          start: '```',
          end: '```',
        },
        {
          token: 'keyword',
          regex: keywordRegex,
        },
        {
          token: keywordMapper,
          regex: '[a-zA-Z_$][a-zA-Z0-9_$]*\\b',
        },
        {
          token: 'keyword.operator',
          regex: '\\+|\\-|\\/|\\/\\/|%|<@>|@>|<@|&|\\^|~|<|>|<=|=>|==|!=|<>|=',
        },
        {
          token: 'paren.lparen',
          regex: '[\\(\\{]',
        },
        {
          token: 'paren.rparen',
          regex: '[\\)\\}]',
        },
        {
          token: 'text',
          regex: '\\s+'
        }
      ]
    };

    this.normalizeRules();
  }
}

export class ClickhouseAceMode extends (TextMode as { new(): any; }) {
  constructor() {
    super();
    this.HighlightRules = ClickhouseHighlightRules;
  }
}
