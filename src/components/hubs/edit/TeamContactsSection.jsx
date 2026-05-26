import SettingsCard from "./SettingsCard";

export default function TeamContactsSection({
  members = [],
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
  setAvatarTargetId,
  Field,
  TextInput,
}) {
  return (
    <SettingsCard
      id="team-contacts"
      title="Team contacts"
      description="People shown in the contact panel."
      action={
        <button
          type="button"
          onClick={addTeamMember}
          className="h-10 transform-gpu cursor-pointer rounded-lg border border-transparent bg-secondary px-4 text-sm font-medium text-white shadow-sm transition-all duration-[600ms] ease-out hover:-translate-y-[2px] hover:border-secondary hover:bg-background hover:text-primary hover:shadow-md"
        >
          Add contact
        </button>
      }
    >
      {members.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-500">
          No team contacts yet.
        </div>
      ) : (
        <div className="space-y-4">
          {members.map((member, index) => (
            <div
              key={member.id}
              className="rounded-md border border-gray-200 bg-gray-50 p-5"
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="text-sm font-semibold text-gray-900">
                  Contact {index + 1}
                </div>

                <button
                  type="button"
                  onClick={() => removeTeamMember(member.id)}
                  className="text-sm font-medium text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
                <Field label="Name" required>
                  <TextInput
                    value={member.name || ""}
                    onChange={(e) =>
                      updateTeamMember(member.id, "name", e.target.value)
                    }
                    placeholder="e.g. Sophie Morgan"
                  />
                </Field>

                <Field label="Job title" required>
                  <TextInput
                    value={member.role || ""}
                    onChange={(e) =>
                      updateTeamMember(member.id, "role", e.target.value)
                    }
                    placeholder="e.g. Account Executive"
                  />
                </Field>

                <Field label="Email" required>
                  <TextInput
                    type="email"
                    value={member.email || ""}
                    onChange={(e) =>
                      updateTeamMember(member.id, "email", e.target.value)
                    }
                    placeholder="sophie@example.com"
                  />
                </Field>

                <Field label="Calendar URL">
                  <TextInput
                    type="url"
                    value={member.calendarUrl || ""}
                    onChange={(e) =>
                      updateTeamMember(member.id, "calendarUrl", e.target.value)
                    }
                    placeholder="https://cal.com/sophie"
                  />
                </Field>

                <Field label="LinkedIn URL">
                  <TextInput
                    type="url"
                    value={member.linkedin || ""}
                    onChange={(e) =>
                      updateTeamMember(member.id, "linkedin", e.target.value)
                    }
                    placeholder="https://linkedin.com/in/sophie"
                  />
                </Field>

                <Field label="Avatar">
                  <div className="flex items-center gap-3">
                    <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-500">
                      {member.avatar?.url || member.avatarUrl ? (
                        <img
                          src={member.avatar?.url || member.avatarUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        (member.name || "C").slice(0, 1).toUpperCase()
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setAvatarTargetId(member.id)}
                      className="h-9 transform-gpu cursor-pointer rounded-lg border border-transparent bg-primary px-3 text-sm font-medium text-white shadow-sm transition-all duration-[600ms] ease-out hover:-translate-y-[2px] hover:border-primary hover:bg-background hover:text-primary hover:shadow-md"
                    >
                      {member.avatar?.url || member.avatarUrl
                        ? "Replace"
                        : "Upload"}
                    </button>

                    {member.avatar?.url || member.avatarUrl ? (
                      <button
                        type="button"
                        onClick={() => {
                          updateTeamMember(member.id, "avatar", null);
                          updateTeamMember(member.id, "avatarUrl", "");
                        }}
                        className="h-9 transform-gpu cursor-pointer rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-red-600 transition-all duration-[600ms] ease-out hover:-translate-y-[2px] hover:bg-red-50 hover:shadow-md"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </Field>
              </div>
            </div>
          ))}
        </div>
      )}
    </SettingsCard>
  );
}
