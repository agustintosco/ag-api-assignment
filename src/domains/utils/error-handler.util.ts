import { ConflictException, NotFoundException } from '@nestjs/common';
import { GraphQLError } from 'graphql';

/**
 * The goal of having this handler is to reuse the services for REST endpoints and avoid code duplication.
 * @param error
 * @returns
 */
export function handleGraphQlError(error: any): GraphQLError {
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
      code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
    },
  });
}
