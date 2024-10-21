import { ConflictException, NotFoundException } from '@nestjs/common';
import { GraphQLError } from 'graphql';

/**
 * The goal of having this handler is to reuse the services for REST endpoints and avoid code duplication.
 * @param error
 * @returns
 */
export function handleError(error: any): GraphQLError {
  console.error('Error stack trace:', error.stack || error);

  if (error instanceof NotFoundException) {
    return new GraphQLError(error.message, {
      extensions: {
        code: 'NOT_FOUND',
      },
    });
  }

  if (error instanceof ConflictException) {
    return new GraphQLError(error.message, {
      extensions: {
        code: 'CONFLICT',
      },
    });
  }

  return new GraphQLError(error.message, {
    extensions: {
      code: 'INTERNAL_SERVER_ERROR',
    },
  });
}
