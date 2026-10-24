import test from "node:test";
import assert from "node:assert/strict";
import { authenticateDemoAccount, canAccessView, resolveView } from "./access.ts";

test("demo credentials identify the configured account role", () => {
  assert.equal(authenticateDemoAccount("admin@example.com", "demo12345"), "admin");
  assert.equal(authenticateDemoAccount("pic@example.com", "demo12345"), "pic");
  assert.equal(authenticateDemoAccount("andi@example.com", "demo12345"), "employee");
  assert.equal(authenticateDemoAccount("  ANDI@example.com  ", "demo12345"), "employee");
});

test("email prefixes and unknown accounts cannot grant a privileged role", () => {
  for (const email of ["admin@other.example", "pic@other.example", "ratna@other.example", "new@example.com"]) {
    assert.equal(authenticateDemoAccount(email, "demo12345"), null);
  }
});

test("an existing demo account still requires its demo password", () => {
  assert.equal(authenticateDemoAccount("admin@example.com", "incorrect"), null);
  assert.equal(authenticateDemoAccount("admin@example.com", ""), null);
  assert.equal(authenticateDemoAccount("andi@example.com", "demo12345 "), null);
});

test("employees and PIC stay in their own areas while Admin can view every area", () => {
  const roles = ["admin", "pic", "employee"];
  for (const sessionRole of [null, ...roles]) {
    for (const view of roles) {
      const allowed = sessionRole === "admin" || sessionRole === view;
      assert.equal(canAccessView(sessionRole, view), allowed, `${sessionRole} -> ${view}`);
    }
    assert.equal(canAccessView(sessionRole, "login"), true);
  }
});

test("rendering falls back to the account area when a forbidden view is requested", () => {
  assert.equal(resolveView(null, "admin"), "login");
  assert.equal(resolveView(null, "pic"), "login");
  assert.equal(resolveView("employee", "admin"), "employee");
  assert.equal(resolveView("employee", "pic"), "employee");
  assert.equal(resolveView("pic", "admin"), "pic");
  assert.equal(resolveView("pic", "employee"), "pic");
  assert.equal(resolveView("admin", "pic"), "pic");
  assert.equal(resolveView("admin", "employee"), "employee");
});
