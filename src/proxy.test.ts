import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";

import { proxy } from "./proxy";

/**
 * Helper to create a NextRequest with an optional nexora-auth cookie.
 */
function createRequest(
  pathname: string,
  authCookie?: { uid: string; role: string }
): NextRequest {
  const url = new URL(pathname, "http://localhost:3000");
  const request = new NextRequest(url);

  if (authCookie) {
    request.cookies.set(
      "nexora-auth",
      JSON.stringify(authCookie)
    );
  }

  return request;
}

describe("proxy - route protection", () => {
  describe("public routes", () => {
    it("allows access to /login without auth", () => {
      const request = createRequest("/login");
      const response = proxy(request);
      expect(response.headers.get("x-middleware-next")).toBe("1");
    });

    it("allows access to /register without auth", () => {
      const request = createRequest("/register");
      const response = proxy(request);
      expect(response.headers.get("x-middleware-next")).toBe("1");
    });

    it("allows access to / (landing page) without auth", () => {
      const request = createRequest("/");
      const response = proxy(request);
      expect(response.headers.get("x-middleware-next")).toBe("1");
    });
  });

  describe("unauthenticated access to protected routes", () => {
    it("redirects unauthenticated user from /admin to /login", () => {
      const request = createRequest("/admin");
      const response = proxy(request);
      expect(response.status).toBe(307);
      expect(new URL(response.headers.get("location")!).pathname).toBe(
        "/login"
      );
    });

    it("redirects unauthenticated user from /startup to /login", () => {
      const request = createRequest("/startup");
      const response = proxy(request);
      expect(response.status).toBe(307);
      expect(new URL(response.headers.get("location")!).pathname).toBe(
        "/login"
      );
    });

    it("redirects unauthenticated user from /mentor to /login", () => {
      const request = createRequest("/mentor");
      const response = proxy(request);
      expect(response.status).toBe(307);
      expect(new URL(response.headers.get("location")!).pathname).toBe(
        "/login"
      );
    });

    it("redirects unauthenticated user from /admin/applications to /login", () => {
      const request = createRequest("/admin/applications");
      const response = proxy(request);
      expect(response.status).toBe(307);
      expect(new URL(response.headers.get("location")!).pathname).toBe(
        "/login"
      );
    });
  });

  describe("authenticated access with correct role", () => {
    it("allows admin to access /admin", () => {
      const request = createRequest("/admin", {
        uid: "user1",
        role: "admin",
      });
      const response = proxy(request);
      expect(response.headers.get("x-middleware-next")).toBe("1");
    });

    it("allows admin to access /admin/analytics", () => {
      const request = createRequest("/admin/analytics", {
        uid: "user1",
        role: "admin",
      });
      const response = proxy(request);
      expect(response.headers.get("x-middleware-next")).toBe("1");
    });

    it("allows startup to access /startup", () => {
      const request = createRequest("/startup", {
        uid: "user2",
        role: "startup",
      });
      const response = proxy(request);
      expect(response.headers.get("x-middleware-next")).toBe("1");
    });

    it("allows startup to access /startup/documents", () => {
      const request = createRequest("/startup/documents", {
        uid: "user2",
        role: "startup",
      });
      const response = proxy(request);
      expect(response.headers.get("x-middleware-next")).toBe("1");
    });

    it("allows mentor to access /mentor", () => {
      const request = createRequest("/mentor", {
        uid: "user3",
        role: "mentor",
      });
      const response = proxy(request);
      expect(response.headers.get("x-middleware-next")).toBe("1");
    });

    it("allows mentor to access /mentor/startups", () => {
      const request = createRequest("/mentor/startups", {
        uid: "user3",
        role: "mentor",
      });
      const response = proxy(request);
      expect(response.headers.get("x-middleware-next")).toBe("1");
    });
  });

  describe("authenticated access with role mismatch", () => {
    it("redirects startup user from /admin to /startup", () => {
      const request = createRequest("/admin", {
        uid: "user2",
        role: "startup",
      });
      const response = proxy(request);
      expect(response.status).toBe(307);
      expect(new URL(response.headers.get("location")!).pathname).toBe(
        "/startup"
      );
    });

    it("redirects mentor user from /admin to /mentor", () => {
      const request = createRequest("/admin", {
        uid: "user3",
        role: "mentor",
      });
      const response = proxy(request);
      expect(response.status).toBe(307);
      expect(new URL(response.headers.get("location")!).pathname).toBe(
        "/mentor"
      );
    });

    it("redirects admin user from /startup to /admin", () => {
      const request = createRequest("/startup", {
        uid: "user1",
        role: "admin",
      });
      const response = proxy(request);
      expect(response.status).toBe(307);
      expect(new URL(response.headers.get("location")!).pathname).toBe(
        "/admin"
      );
    });

    it("redirects mentor user from /startup/documents to /mentor", () => {
      const request = createRequest("/startup/documents", {
        uid: "user3",
        role: "mentor",
      });
      const response = proxy(request);
      expect(response.status).toBe(307);
      expect(new URL(response.headers.get("location")!).pathname).toBe(
        "/mentor"
      );
    });

    it("redirects admin user from /mentor/startups to /admin", () => {
      const request = createRequest("/mentor/startups", {
        uid: "user1",
        role: "admin",
      });
      const response = proxy(request);
      expect(response.status).toBe(307);
      expect(new URL(response.headers.get("location")!).pathname).toBe(
        "/admin"
      );
    });
  });

  describe("invalid auth cookie", () => {
    it("redirects to /login when cookie has invalid JSON", () => {
      const url = new URL("/admin", "http://localhost:3000");
      const request = new NextRequest(url);
      request.cookies.set("nexora-auth", "not-valid-json");
      const response = proxy(request);
      expect(response.status).toBe(307);
      expect(new URL(response.headers.get("location")!).pathname).toBe(
        "/login"
      );
    });

    it("redirects to /login when cookie has missing uid", () => {
      const url = new URL("/admin", "http://localhost:3000");
      const request = new NextRequest(url);
      request.cookies.set("nexora-auth", JSON.stringify({ role: "admin" }));
      const response = proxy(request);
      expect(response.status).toBe(307);
      expect(new URL(response.headers.get("location")!).pathname).toBe(
        "/login"
      );
    });

    it("redirects to /login when cookie has invalid role", () => {
      const url = new URL("/admin", "http://localhost:3000");
      const request = new NextRequest(url);
      request.cookies.set(
        "nexora-auth",
        JSON.stringify({ uid: "user1", role: "invalid" })
      );
      const response = proxy(request);
      expect(response.status).toBe(307);
      expect(new URL(response.headers.get("location")!).pathname).toBe(
        "/login"
      );
    });
  });
});
