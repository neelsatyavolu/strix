'use client';
import StudyPlan from '../StudyPlan';
import TutorAssignments from '../TutorAssignments';

// Plan — what to do this week. Students see their plan plus tutor assignments;
// a tutor sees the watched student's plan context and assigns work.

export default function PlanHub({ go, role = 'student', ...watchProps }) {
  if (role === 'tutor') return <TutorAssignments go={go} {...watchProps} />;
  return <StudyPlan go={go} {...watchProps} />;
}
