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
  required: true,
  propertyNames: {pattern: '^hpmor-[0-9]+-[0-9]+$'},
  additionalProperties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      subjects: {type: 'array', items: {type: 'string'}, minItems: 1},
      text: {type: 'string'},
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
    // At least one of 'notes' and 'subjects' must be specified
    anyOf: [
      {
        required: ['text', 'notes'],
      },
      {
        required: ['text', 'subjects'],
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
    required: ['id', 'text', 'replacement', 'notes', 'disambiguation', 'subjects'],
    additionalProperties: false,
    properties: {
      id: {type: 'string'},
      subjects: {type: 'array', items: {type: 'string'}},
      text: {type: 'string'},
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
