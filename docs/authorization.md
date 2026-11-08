\# SolarQualify Authorization and Access Control



\## 1. Purpose



SolarQualify uses Role-Based Access Control (RBAC) to restrict access to API

operations based on the authenticated user's role.



The application supports two roles:



\- `homeowner`

\- `salesStaff`



There is no public admin role.



\## 2. Authentication and Authorization



Authentication identifies the user through a verified JWT access token.



Authorization checks whether the authenticated user's current role is

permitted to perform an operation.



The backend uses two middleware components:



\- `authenticate.js`: verifies the JWT, retrieves the active user from

&#x20; MongoDB, and attaches the current user to `req.user`.

\- `authorize.js`: checks whether `req.user.role` is included in the roles

&#x20; permitted for the requested route.



A missing or invalid authentication token returns HTTP 401.



An authenticated user without the required role receives HTTP 403.



\## 3. Role-Permission Matrix



| Feature | Homeowner | Sales Staff |

|---|---|---|

| Register an account | Yes | No public registration |

| Log in | Yes | Yes |

| View own profile | Yes | Yes |

| Submit a solar enquiry | Yes | No |

| View own leads | Yes | No |

| View assigned leads | No | Yes |

| Review customer bill information | Own bills | Assigned customer bills |

| View own quotations | Yes | No |

| Create and manage quotations | No | Yes |

| View own project progress | Yes | No |

| Update project milestones | No | Assigned projects |

| View own project documents | Yes | No |

| Manage customer project documents | No | Assigned projects |

| View and manage pricing rules | No | Subject to authorized route policy |

| View and manage subsidy rules | No | Subject to authorized route policy |

| Access audit records | No | Subject to authorized route policy |



\## 4. Registration Policy



Public registration always assigns the `homeowner` role.



The role submitted by a client is never used to determine the account's

permissions.



Sales Staff accounts must be created through a controlled provisioning

process. Public registration must not create Sales Staff accounts.



\## 5. Resource Ownership and Assignment



Role checks alone are not sufficient to protect customer records.



Every business API must also enforce resource-level authorization.



\### Homeowners



A homeowner may access only resources associated with their own user ID.



Examples include:



\- Their leads and electricity bill analyses.

\- Their quotations.

\- Their project information.

\- Their uploaded project documents.



\### Sales Staff



Sales Staff may access customer records only where they have an authorized

assignment or another explicitly permitted relationship.



Examples include:



\- Assigned leads.

\- Related customer bill analyses.

\- Quotations for permitted leads.

\- Projects assigned to them.



The backend must verify ownership or assignment in the database query.

It must not rely only on IDs supplied by the client.



\## 6. HTTP Authorization Responses



| HTTP Status | Meaning |

|---|---|

| 200 | Authorized operation successful |

| 201 | Authorized resource created |

| 401 | Authentication required or token invalid |

| 403 | Authenticated user lacks the required role |

| 404 | Resource does not exist or is not exposed to the requester |



\## 7. JWT and Session Considerations



\- Access tokens are signed using the configured JWT secret.

\- Tokens include the user ID as the subject and the assigned role.

\- The authentication middleware loads the current role from MongoDB.

\- Inactive accounts cannot access protected routes.

\- Password hashes are excluded from normal user query results.

\- Logout instructs the client to discard its access token.



The current JWT logout endpoint does not revoke an already-issued token.

A token remains valid until expiry unless the user's account becomes inactive

or another server-side validation rule rejects it.



\## 8. Current Implementation Status



Implemented:



\- JWT authentication middleware.

\- Role authorization middleware.

\- Homeowner and Sales Staff role validation.

\- HTTP 401 and 403 error handling.

\- Public registration restricted to the homeowner role.

\- Unit and route-level authorization tests.



Pending integration:



\- Applying role middleware to the Leads, Quotations, Projects, Pricing,

&#x20; Subsidy, and Document APIs as those routes are implemented.

\- Enforcing ownership and Sales Staff assignment checks on every

&#x20; customer-specific resource operation.

\- Defining controlled Sales Staff account provisioning.



\## 9. Security Principles



1\. Deny access by default.

2\. Never trust role values supplied by the client.

3\. Verify resource ownership or assignment on the server.

4\. Do not expose password hashes or sensitive document storage URLs.

5\. Keep customer records isolated between users.

6\. Record sensitive business operations in audit logs.
