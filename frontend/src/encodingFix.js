const replacements = {
  'âŒ‚': '📊',
  'â—Œ': '👥',
  'â–¦': '🏢',
  'â™§': '🧑‍🏫',
  'â—«': '📅',
  'â—ˆ': '📢',
  'â–¥': '📈',
  'âš™': '⚙️',
  'â†ª': '↪️',
  'â˜°': '☰',
  'âœ“': '✓',
  'âœ¦': '✨',
  'â†’': '→',
  'âŒ•': '🔎',
  'Â·': '·',
  'Ã—': '×',
  'ï¼‹': '＋',
}

function repairText(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes = []
  let node
  while ((node = walker.nextNode())) nodes.push(node)

  nodes.forEach((textNode) => {
    let value = textNode.nodeValue
    Object.entries(replacements).forEach(([broken, fixed]) => {
      if (value.includes(broken)) value = value.split(broken).join(fixed)
    })
    if (value !== textNode.nodeValue) textNode.nodeValue = value
  })
}

function startEncodingRepair() {
  repairText(document.body)
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) repairText(node.parentElement || document.body)
        else if (node.nodeType === Node.ELEMENT_NODE) repairText(node)
      })
    })
  })
  observer.observe(document.body, { childList: true, subtree: true })
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startEncodingRepair, { once: true })
else startEncodingRepair()
