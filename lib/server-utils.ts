import { ObjectId } from "mongodb";

export function getCourseIdQuery(courseId: string) {
  if (!courseId) return { _id: "" };
  if (ObjectId.isValid(courseId) && courseId.length === 24) {
    return { $or: [{ _id: new ObjectId(courseId) }, { _id: courseId }] };
  }
  return { _id: courseId };
}
