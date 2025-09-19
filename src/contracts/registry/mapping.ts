// FE-3: Settings mapping configuration

export const mapping = [
  {
    field: "preferred_pace",
    writer: "preferences",
    payload_path: "preferred_pace",
    read_path: "user.preferences.preferred_pace"
  },
  {
    field: "connection_purpose",
    writer: "unavailable",
    read_path: "user.profile.connection_purpose"
  }
] as const;

export default mapping;
