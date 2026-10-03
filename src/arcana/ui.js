/* ===================================================================
 * Dreoarcana Arcana — dialog helpers
 *
 * Thin wrapper over DialogV2 (falling back to V1 if a world somehow
 * lacks it). Callers pass a <div> wrapper, not a <form>: DialogV2's own
 * root is a form and browsers silently drop a nested one.
 * =================================================================== */

const DialogV2 = foundry.applications?.api?.DialogV2 ?? null;

export async function formDialog({
  title, content, label = "OK", parse, onRender,
  width = 520, height = "auto", resizable = true
}) {
  if (DialogV2) {
    const result = await DialogV2.wait({
      window: { title, resizable },
      position: { width, height },
      content,
      buttons: [
        {
          action: "ok", label, default: true,
          callback: (event, button) => {
            const form = button.form ?? button.closest("form") ?? findForm(button);
            return parse(form);
          }
        },
        { action: "cancel", label: "Cancel", callback: () => null }
      ],
      rejectClose: false,
      render: (event, dialog) => {
        if (!onRender) return;
        const root = dialog.element ?? dialog;
        onRender(root.querySelector("form") ?? root, root);
      }
    });
    return result ?? null;
  }

  return Dialog.wait({
    title,
    content: `<form>${content}</form>`,
    buttons: {
      ok: { label, callback: (html) => {
        const root = html instanceof HTMLElement ? html : html[0];
        return parse(root.querySelector("form") ?? root);
      }},
      cancel: { label: "Cancel", callback: () => null }
    },
    default: "ok",
    render: (html) => {
      if (!onRender) return;
      const root = html instanceof HTMLElement ? html : html[0];
      onRender(root.querySelector("form") ?? root, root);
    },
    close: () => null
  });
}

function findForm(el) {
  let node = el;
  while (node && node.tagName !== "FORM") node = node.parentElement ?? node.getRootNode?.()?.host;
  return node;
}

export async function confirmDialog({ title, content, yesLabel = "Yes", noLabel = "No" }) {
  if (DialogV2) {
    return DialogV2.confirm({
      window: { title }, content,
      yes: { label: yesLabel, default: false },
      no: { label: noLabel, default: true },
      rejectClose: false
    });
  }
  return Dialog.confirm({ title, content, yes: () => true, no: () => false, defaultYes: false });
}
