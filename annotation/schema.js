// TODO: put valid tags into actual code somewhere
const validTags = [
  'foreshadowing',
  'consequence',
  'reference',
  'departure',
  'original',
  'speculation',
  'background',
  'spoiler',
];

// Either an annotation or an anchor
const rawAnnotation = {
  type: 'object',
  required: true,
  propertyNames: {pattern: '^hpmor-[0-9]+-[0-9]+$'},
  additionalProperties: {
    type: 'object',
    required: ['tags', 'text', 'note', 'disambiguation', 'subjects'],
    additionalProperties: false,
    properties: {
      id: {type: 'string'},
      tags: {type: 'array', items: {type: 'string', enum: validTags}, minItems: 1},
      subjects: {type: 'array', items: {type: 'string'}},
      text: {type: 'string'},
      replacement: {type: 'string'},
      note: {type: 'string'},
      disambiguation: {
        type: 'object',
        required: ['expect', 'useIndex'],
        additionalProperties: false,
        properties: {
          expect: {type: 'integer', minimum: 1},
          useIndex: {type: 'integer', minimum: 0},
        },
      },
    },
  },
};

const annotation = {
  type: 'object',
  required: true,
  propertyNames: {pattern: '^hpmor-[0-9]+-[0-9]+$'},
  additionalProperties: {
    type: 'object',
    required: ['id', 'tags', 'text', 'replacement', 'note', 'disambiguation', 'subjects'],
    additionalProperties: false,
    properties: {
      id: {type: 'string'},
      tags: {type: 'array', items: {type: 'string', enum: validTags}, minItems: 1},
      subjects: {type: 'array', items: {type: 'string'}},
      text: {type: 'string'},
      replacement: {type: 'string'},
      note: {type: 'string'},
      disambiguation: {
        type: 'object',
        required: ['expect', 'useIndex'],
        additionalProperties: false,
        properties: {
          expect: {type: 'integer', minimum: 1},
          useIndex: {type: 'integer', minimum: 0},
        },
      },
    },
  },
};

const anchor = {
  type: 'object',
  required: true,
  propertyNames: {pattern: '^hpmor-[0-9]+-[0-9]+-[0-9]+$'},
  additionalProperties: {
    type: 'object',
    required: ['id', 'annotationId', 'annotationChapter', 'text', 'disambiguation'],
    additionalProperties: false,
    properties: {
      id: {type: 'string'},
      annotationId: {type: 'string'},
      annotationChapter: {type: 'string'},
      text: {type: 'string'},
      disambiguation: {
        type: 'object',
        required: ['expect', 'useIndex'],
        additionalProperties: false,
        properties: {
          expect: {type: 'integer', minimum: 1},
          useIndex: {type: 'integer', minimum: 0},
        },
      },
    },
  },
};

module.exports = {
  rawAnnotation,
  annotation,
  anchor,
};
