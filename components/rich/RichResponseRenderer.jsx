'use client';

import CareerCard from './CareerCard';
import ComparisonTable from './ComparisonTable';
import ActionPlan from './ActionPlan';

import CommunityInsight from './CommunityInsight';
import CertificationCard from './CertificationCard';
import ProjectIdea from './ProjectIdea';
import LearningRoadmap from './LearningRoadmap';
import ExportPreview from './ExportPreview';
import SkillRadar from './SkillRadar';
import SalaryBreakdown from './SalaryBreakdown';

/**
 * Dispatches a rich_component JSON object to the appropriate React component.
 * Validates required shape per type before rendering — returns null on bad
 * data so the UI never crashes because of a malformed AI response.
 */
export default function RichResponseRenderer({ component, onSuggestionClick }) {
    if (!component || typeof component !== 'object') return null;

    const { type, data } = component;
    if (!data || typeof data !== 'object') return null;

    try {
        switch (type) {
            case 'career_card':
                if (!data.careerName) return null;
                return <CareerCard {...data} onSuggestionClick={onSuggestionClick} />;

            case 'comparison_table':
                if (!Array.isArray(data.careers) || data.careers.length < 2) return null;
                return <ComparisonTable {...data} onSuggestionClick={onSuggestionClick} />;

            case 'action_plan':
                if (!Array.isArray(data.weeks) || data.weeks.length === 0) return null;
                return <ActionPlan {...data} onSuggestionClick={onSuggestionClick} />;


            case 'community_insight':
                if (!data.insight) return null;
                return <CommunityInsight {...data} onSuggestionClick={onSuggestionClick} />;

            case 'certification_card':
                if (!data.name) return null;
                return <CertificationCard {...data} onSuggestionClick={onSuggestionClick} />;

            case 'project_idea':
                if (!data.title) return null;
                return <ProjectIdea {...data} onSuggestionClick={onSuggestionClick} />;

            case 'learning_roadmap':
                if (!Array.isArray(data.items) || data.items.length === 0) return null;
                return <LearningRoadmap {...data} onSuggestionClick={onSuggestionClick} />;

            case 'export_preview':
                if (!Array.isArray(data.sections) || data.sections.length === 0) return null;
                return <ExportPreview {...data} onSuggestionClick={onSuggestionClick} />;

            case 'skill_radar':
                if (!Array.isArray(data.skills) || data.skills.length < 3) return null;
                return <SkillRadar {...data} onSuggestionClick={onSuggestionClick} />;

            case 'salary_breakdown':
                if (!Array.isArray(data.data) || data.data.length === 0) return null;
                return <SalaryBreakdown {...data} onSuggestionClick={onSuggestionClick} />;

            default:
                return null;
        }
    } catch (err) {
        console.error('RichResponseRenderer error:', err);
        return null;
    }
}
