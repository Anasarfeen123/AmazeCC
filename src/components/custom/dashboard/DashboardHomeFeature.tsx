"use client";

import type { ComponentProps } from "react";
import { useAtomValue } from "jotai";
import { unifiedIdentityAtom, unifiedAcademicsAtom } from "@/store";
import type { UnifiedUserIdentity } from "@/types";
import SimplifiedHome from "../mobile/SimplifiedMobileHome";

type SimplifiedHomeProps = ComponentProps<typeof SimplifiedHome>;

interface DashboardHomeFeatureProps extends SimplifiedHomeProps {
  calendarData?: SimplifiedHomeProps["calendarData"];
  ScheduleData?: SimplifiedHomeProps["ScheduleData"];
  setActiveToolsSubTab?: SimplifiedHomeProps["setActiveToolsSubTab"];
  setGradesDisplayIsOpen?: SimplifiedHomeProps["setGradesDisplayIsOpen"];
}

/** Renders the home dashboard. */
export default function DashboardHomeFeature(props: DashboardHomeFeatureProps) {
  const unifiedIdentity: UnifiedUserIdentity = useAtomValue(unifiedIdentityAtom);
  const unifiedAcademics = useAtomValue(unifiedAcademicsAtom);

  const normalizedProfile = props.profileData || {
    name: unifiedIdentity.name,
    studentName: unifiedIdentity.name,
    branch: unifiedIdentity.programme,
    programme: unifiedIdentity.programme,
    school: unifiedIdentity.school,
    campus: unifiedIdentity.campus,
    regNo: unifiedIdentity.regNumber,
    registerNumber: unifiedIdentity.regNumber,
    image: unifiedIdentity.photo,
    photo: unifiedIdentity.photo,
    email: unifiedIdentity.email,
    mobileNumber: unifiedIdentity.phone,
    bloodGroup: unifiedIdentity.bloodGroup,
  };

  const enhancedProps: DashboardHomeFeatureProps = {
    ...props,
    profileData: normalizedProfile,
    attendanceData:
      props.attendanceData ||
      (unifiedAcademics.courses.length > 0
        ? ({
            attendance: unifiedAcademics.courses,
            semester: unifiedAcademics.semesterId,
          } as any)
        : props.attendanceData),
  };

  // Privacy mode hides values only on Home and the sidebar (globals.css).
  return (
    <div data-privacy-zone="home" className="contents">
      <SimplifiedHome {...enhancedProps} />
    </div>
  );
}
