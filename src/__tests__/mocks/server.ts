import { setupServer } from 'msw/node';
import { authHandlers } from '../handlers/authHandlers';
import { sharesHandlers } from '../handlers/sharesHandlers';
import { notificationsHandlers } from '../handlers/notificationsHandlers';
import { communitiesHandlers } from '../handlers/communitiesHandlers';
import { booksHandlers } from '../handlers/booksHandlers';
import { userBooksHandlers } from '../handlers/userBooksHandlers';

// This configures a request mocking server with the given request handlers
export const server = setupServer(
  ...authHandlers,
  ...sharesHandlers,
  ...notificationsHandlers,
  ...communitiesHandlers,
  ...booksHandlers,
  ...userBooksHandlers,
);
