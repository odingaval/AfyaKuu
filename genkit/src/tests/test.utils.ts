import weaviate from 'weaviate-ts-client';
import winston from 'winston';

// Mock Weaviate client
export const mockWeaviateClient = {
  data: {
    creator: jest.fn().mockReturnThis(),
    getterById: jest.fn().mockReturnThis(),
    deleter: jest.fn().mockReturnThis(),
    withClassName: jest.fn().mockReturnThis(),
    withProperties: jest.fn().mockReturnThis(),
    withId: jest.fn().mockReturnThis(),
    do: jest.fn(),
  },
  schema: {
    getter: jest.fn().mockReturnThis(),
    classCreator: jest.fn().mockReturnThis(),
    withClass: jest.fn().mockReturnThis(),
    do: jest.fn(),
  },
  graphql: {
    get: jest.fn().mockReturnThis(),
    withClassName: jest.fn().mockReturnThis(),
    withFields: jest.fn().mockReturnThis(),
    withNearText: jest.fn().mockReturnThis(),
    withLimit: jest.fn().mockReturnThis(),
    do: jest.fn(),
  },
};

// Mock logger
export const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};