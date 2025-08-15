/**
 * Organization Wizard - Simplified single-tab approach
 *
 * This replaces the complex multi-tab wizard with a streamlined approach
 * that only handles basic organization information and logo upload.
 */

import React from "react";
import { useNavigate } from "../../../utils/SimpleRouter";

// Import simplified wizard
import SimplifiedOrganizationWizard from "../../../components/wizard/SimplifiedOrganizationWizard";

// Types
import { Organization } from "../../../types/wizard.types";

const OrganizationWizard: React.FC = () => {
  // Navigation
  const navigate = useNavigate();
  
  /**
   * Handle successful organization creation
   */
  const handleOrganizationComplete = (organization: Organization) => {
    // Navigate to dashboard or next step
    navigate('/dashboard');
  };
  
  /**
   * Handle wizard cancellation
   */
  const handleWizardCancel = () => {
    // Navigate back to dashboard or previous page
    navigate('/dashboard');
  };

  return (
    <SimplifiedOrganizationWizard
      onComplete={handleOrganizationComplete}
      onCancel={handleWizardCancel}
      className="organization-wizard-page"
    />
  );
};

export default OrganizationWizard;