/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user: import('./db/schema').User | null;
    member: import('./db/schema').Member | null;
  }
}
