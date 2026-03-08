# Contributing Guidelines

Thank you for contributing to the **Integrated Food Delivery and Dine-Out Platform**.

We follow a structured workflow to maintain code quality.

---

# Branch Strategy

main → production ready code
dev → development branch
feature/* → new features

Example:

feature/authentication
feature/order-api
feature/realtime-tracking

---

# Workflow

1. Fork the repository
2. Create a new branch

```
git checkout -b feature/your-feature-name
```

3. Make changes

4. Commit changes

```
git commit -m "Added restaurant discovery API"
```

5. Push branch

```
git push origin feature/your-feature-name
```

6. Create Pull Request to `dev` branch

---

# Code Standards

* Use ESLint rules
* Write modular code
* Avoid hardcoded values
* Use environment variables

---

# Pull Request Requirements

Each PR must include:

* Clear description
* Screenshot (if UI change)
* Tested code
* No merge conflicts

---

# Issue Reporting

When creating issues include:

* Bug description
* Steps to reproduce
* Expected behaviour
* Screenshots (if applicable)
