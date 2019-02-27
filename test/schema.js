'use strict';

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

const rawTags = validTags.concat(['TODO']);

const disambiguation = {
  type: 'object',
  required: ['expect', 'useIndex'],
  additionalProperties: false,
  properties: {
    expect: {type: 'integer', minimum: 1},
    useIndex: {type: 'integer', minimum: 0},
  },
};

// Annotations and subject anchors declared in the same structure
const rawAnnotations = {
  type: 'array',
  items: {
    type: 'object',
    additionalProperties: false,
    properties: {
      subjects: {type: 'array', items: {type: 'string'}, minItems: 1},
      text: {type: 'string'},
      title: {type: 'string'},
      notes: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['note', 'tags'],
          additionalProperties: false,
          properties: {
            tags: {type: 'array', items: {type: 'string', enum: rawTags}, minItems: 1},
            note: {type: 'string'},
          },
        },
      },
      disambiguation,
    },
    allOf: [
      {
        // Matching is different for text vs title, so the annotation must
        // specify either text or title.
        oneOf: [
          {required: ['title'], not: {required: ['text']}},
          {required: ['text'], not: {required: ['title']}},
        ],
      },
      {
        // At least one of 'notes' and 'subjects' must be specified
        anyOf: [
          {required: ['notes']},
          {required: ['subjects']},
        ],
      },
    ],
  },
};

const annotations = {
  type: 'object',
  required: true,
  propertyNames: {pattern: '^hpmor-[0-9]+-[0-9]+$'},
  additionalProperties: {
    type: 'object',
    required: ['id', 'text', 'title', 'replacement', 'notes', 'disambiguation', 'subjects'],
    additionalProperties: false,
    properties: {
      id: {type: 'string'},
      subjects: {type: 'array', items: {type: 'string'}},
      text: {type: 'string'},
      title: {type: 'boolean'},
      replacement: {type: 'string'},
      notes: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['note', 'tags'],
          additionalProperties: false,
          properties: {
            tags: {type: 'array', items: {type: 'string', enum: validTags}, minItems: 1},
            note: {type: 'string'},
          },
        },
      },
      disambiguation,
    },
  },
};

const anchors = {
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
      disambiguation,
    },
  },
};

module.exports = {
  rawAnnotations,
  annotations,
  anchors,
};
