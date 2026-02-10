/**
 * CJX Animations & Interactions
 * Customer Journey Experience enhancements
 */

// CJX Stage Detection
document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const cjxStage = getCJXStage(body);

  console.log(`CJX Stage: ${cjxStage}`);

  // Apply stage-specific animations
  applyStageAnimations(cjxStage);

  // Initialize interactions
  initializeModalHandlers();
  initializeButtonAnimations();
  initializeCardHovers();
});

/**
 * Get CJX stage from body class
 */
function getCJXStage(body) {
  const classes = Array.from(body.classList);
  const cjxClass = classes.find(cls => cls.startsWith('cjx-'));
  return cjxClass ? cjxClass.replace('cjx-', '') : 'unknown';
}

/**
 * Apply animations based on CJX stage
 */
function applyStageAnimations(stage) {
  const elements = document.querySelectorAll('[data-cjx-entrance]');

  elements.forEach((element, index) => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';

    setTimeout(() => {
      element.style.transition = 'all 500ms ease-out';
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    }, index * 100);
  });
}

/**
 * Modal handlers
 */
function initializeModalHandlers() {
  // Open modal
  document.querySelectorAll('[data-modal-trigger]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const modalId = trigger.getAttribute('data-modal-trigger');
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.style.display = 'flex';
        // Focus first interactive element
        const firstInput = modal.querySelector('input, button, a');
        if (firstInput) firstInput.focus();
      }
    });
  });

  // Close modal
  document.querySelectorAll('[data-modal-close]').forEach(closeBtn => {
    closeBtn.addEventListener('click', (e) => {
      const modal = closeBtn.closest('.modal-overlay');
      if (modal) {
        modal.style.display = 'none';
      }
    });
  });

  // Close on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.style.display = 'none';
      }
    });
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const openModal = document.querySelector('.modal-overlay[style*="display: flex"]');
      if (openModal) {
        openModal.style.display = 'none';
      }
    }
  });
}

/**
 * Button animations
 */
function initializeButtonAnimations() {
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      // Ripple effect
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.style.position = 'absolute';
      ripple.style.borderRadius = '50%';
      ripple.style.background = 'rgba(255, 255, 255, 0.5)';
      ripple.style.transform = 'scale(0)';
      ripple.style.animation = 'ripple 600ms ease-out';
      ripple.style.pointerEvents = 'none';

      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    });
  });
}

/**
 * Card hover effects
 */
function initializeCardHovers() {
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-4px)';
      this.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.6)';
    });

    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.5)';
    });
  });
}

/**
 * Tab switching
 */
function switchTab(tabId) {
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.tab-panel');

  tabs.forEach(tab => {
    if (tab.getAttribute('data-tab') === tabId) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  panels.forEach(panel => {
    if (panel.getAttribute('data-tab-panel') === tabId) {
      panel.style.display = 'block';
      panel.classList.add('slide-up');
    } else {
      panel.style.display = 'none';
    }
  });
}

/**
 * Update progress bar
 */
function updateProgressBar(elementId, percentage) {
  const progressBar = document.getElementById(elementId);
  if (progressBar) {
    const fill = progressBar.querySelector('.progress-fill');
    if (fill) {
      fill.style.width = percentage + '%';

      // Color coding based on percentage
      if (percentage < 20) {
        fill.style.background = 'var(--color-warning)';
        fill.style.boxShadow = '0 0 20px rgba(255, 214, 0, 0.6)';
      } else {
        fill.style.background = 'var(--color-primary)';
        fill.style.boxShadow = 'var(--glow-primary)';
      }
    }
  }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.position = 'fixed';
  toast.style.top = '20px';
  toast.style.right = '20px';
  toast.style.padding = '16px 24px';
  toast.style.borderRadius = '8px';
  toast.style.color = 'white';
  toast.style.fontWeight = '600';
  toast.style.zIndex = '9999';
  toast.style.animation = 'slideUp 300ms ease-out';

  if (type === 'error') {
    toast.style.background = 'var(--color-danger)';
  } else if (type === 'success') {
    toast.style.background = 'var(--color-success)';
  } else {
    toast.style.background = 'var(--color-info)';
  }

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOut 300ms ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Add ripple animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }

  @keyframes fadeOut {
    to {
      opacity: 0;
      transform: translateY(-20px);
    }
  }
`;
document.head.appendChild(style);

// Export for global use
window.CJX = {
  switchTab,
  updateProgressBar,
  showToast
};
