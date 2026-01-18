# Proposal: Fix Markdown Rendering in Visual Editor

**Why:** The current visual editor does not render Markdown formatting, treating all content as plain text. This limits the expressiveness of the prompts and makes them harder to read. Enabling Markdown support will allow users to create richer and more structured prompts.

**Scope:**
-   Modify the `VisualEditor` component to correctly interpret and display Markdown.
-   Ensure that existing variable functionality (`{{variable}}`) remains intact.

**Out of Scope:**
-   Adding new Markdown features not supported by the chosen library.
-   Changing the overall look and feel of the editor beyond rendering Markdown.
