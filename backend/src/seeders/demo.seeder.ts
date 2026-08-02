import "dotenv/config";
import mongoose from "mongoose";
import connectDatabase from "../config/database.config";
import AccountModel from "../models/account.model";
import MemberModel from "../models/member.model";
import ProjectModel from "../models/project.model";
import RoleModel from "../models/roles-permission.model";
import TaskModel from "../models/task.model";
import UserModel, { UserDocument } from "../models/user.model";
import WorkspaceModel from "../models/workspace.model";
import { ProviderEnum } from "../enums/account-provider.enum";
import { Roles } from "../enums/role.enum";
import { TaskPriorityEnum, TaskStatusEnum } from "../enums/task.enum";

/**
 * Seeds the public demo tenant: one populated workspace, a second empty-ish one
 * to exercise the workspace switcher, four users covering every role, and a
 * spread of tasks that makes the analytics widgets show non-trivial numbers.
 *
 * Safe to re-run — it deletes only the data it owns, keyed off DEMO_EMAILS,
 * and leaves any other tenant in the database untouched.
 *
 *   npm run seed        # roles first — this script depends on them
 *   npm run seed:demo
 */

const DEMO_PASSWORD = "demo1234";

const DEMO_USERS = [
  { email: "demo@taskflow.dev", name: "Demo User", role: Roles.OWNER },
  { email: "maya@taskflow.dev", name: "Maya Okonkwo", role: Roles.ADMIN },
  { email: "tobi@taskflow.dev", name: "Tobi Adeyemi", role: Roles.MEMBER },
  { email: "lena@taskflow.dev", name: "Lena Fischer", role: Roles.MEMBER },
] as const;

const DEMO_EMAILS = DEMO_USERS.map((user) => user.email);

const days = (offset: number) =>
  new Date(Date.now() + offset * 24 * 60 * 60 * 1000);

type SeedTask = {
  title: string;
  description?: string;
  project: string;
  status: keyof typeof TaskStatusEnum;
  priority: keyof typeof TaskPriorityEnum;
  /** Index into DEMO_USERS, or null to leave the task unassigned. */
  assignee: number | null;
  /** Days from now; negative is overdue. */
  due: number | null;
};

const PROJECTS = [
  {
    key: "mobile",
    name: "Mobile App v2",
    emoji: "🚀",
    description: "Rewrite of the iOS and Android clients on a shared core.",
  },
  {
    key: "design",
    name: "Design System",
    emoji: "🎨",
    description: "Shared component library, tokens and documentation.",
  },
  {
    key: "platform",
    name: "Platform & Infra",
    emoji: "⚙️",
    description: "CI/CD, observability and cost work.",
  },
  {
    key: "marketing",
    name: "Q3 Marketing Site",
    emoji: "📣",
    description: "Public site refresh ahead of the Q3 launch.",
  },
];

// Deliberately unbalanced: overdue and completed counts must be non-zero so the
// analytics cards on the dashboard have something to show.
const TASKS: SeedTask[] = [
  // Mobile App v2
  { title: "Ship offline task cache", project: "mobile", status: "IN_PROGRESS", priority: "HIGH", assignee: 1, due: 4, description: "Queue mutations locally and replay them on reconnect." },
  { title: "Fix crash on cold start (Android 14)", project: "mobile", status: "IN_REVIEW", priority: "HIGH", assignee: 2, due: 1 },
  { title: "Biometric unlock", project: "mobile", status: "TODO", priority: "MEDIUM", assignee: 3, due: 11 },
  { title: "Push notification permissions prompt", project: "mobile", status: "TODO", priority: "MEDIUM", assignee: null, due: 14 },
  { title: "Migrate to React Native 0.76", project: "mobile", status: "BACKLOG", priority: "LOW", assignee: null, due: null },
  { title: "Release 2.0 to TestFlight", project: "mobile", status: "DONE", priority: "HIGH", assignee: 1, due: -6 },
  { title: "Audit bundle size", project: "mobile", status: "DONE", priority: "LOW", assignee: 2, due: -12 },
  { title: "Deep links for shared tasks", project: "mobile", status: "TODO", priority: "LOW", assignee: 3, due: -2 },

  // Design System
  { title: "Token pipeline: Figma → CSS vars", project: "design", status: "IN_PROGRESS", priority: "HIGH", assignee: 3, due: 2, description: "Single source of truth for colour, spacing and type." },
  { title: "Dark mode audit across primitives", project: "design", status: "IN_REVIEW", priority: "MEDIUM", assignee: 1, due: 3 },
  { title: "Document Button variants", project: "design", status: "TODO", priority: "LOW", assignee: 2, due: 9 },
  { title: "Replace ad-hoc modals with Dialog", project: "design", status: "TODO", priority: "MEDIUM", assignee: null, due: -1 },
  { title: "Icon set licensing review", project: "design", status: "BACKLOG", priority: "LOW", assignee: null, due: null },
  { title: "Publish v1.2 to the registry", project: "design", status: "DONE", priority: "MEDIUM", assignee: 3, due: -8 },
  { title: "Accessibility pass: focus rings", project: "design", status: "DONE", priority: "HIGH", assignee: 1, due: -4 },

  // Platform & Infra
  { title: "Add integration tests to CI", project: "platform", status: "IN_PROGRESS", priority: "HIGH", assignee: 0, due: 5, description: "Supertest against an in-memory Mongo instance." },
  { title: "Structured logging with pino", project: "platform", status: "TODO", priority: "MEDIUM", assignee: 0, due: 8 },
  { title: "Blue/green deploys on Render", project: "platform", status: "TODO", priority: "MEDIUM", assignee: 1, due: 16 },
  { title: "Alerting on 5xx rate", project: "platform", status: "BACKLOG", priority: "MEDIUM", assignee: null, due: null },
  { title: "Cut staging Atlas tier", project: "platform", status: "BACKLOG", priority: "LOW", assignee: null, due: null },
  { title: "Rotate JWT signing secret", project: "platform", status: "IN_REVIEW", priority: "HIGH", assignee: 0, due: -3 },
  { title: "Compound indexes on tasks", project: "platform", status: "DONE", priority: "HIGH", assignee: 0, due: -9 },
  { title: "Rate limit auth endpoints", project: "platform", status: "DONE", priority: "HIGH", assignee: 0, due: -15 },

  // Q3 Marketing Site
  { title: "Rewrite pricing page copy", project: "marketing", status: "IN_PROGRESS", priority: "MEDIUM", assignee: 2, due: 6 },
  { title: "Case study: Northwind", project: "marketing", status: "TODO", priority: "MEDIUM", assignee: 3, due: 13 },
  { title: "Lighthouse ≥ 95 on mobile", project: "marketing", status: "TODO", priority: "HIGH", assignee: 2, due: -5 },
  { title: "Swap hero illustration", project: "marketing", status: "IN_REVIEW", priority: "LOW", assignee: 3, due: 7 },
  { title: "Cookie consent banner", project: "marketing", status: "BACKLOG", priority: "LOW", assignee: null, due: null },
  { title: "Launch changelog page", project: "marketing", status: "DONE", priority: "MEDIUM", assignee: 2, due: -7 },
  { title: "SEO meta for docs routes", project: "marketing", status: "DONE", priority: "LOW", assignee: 3, due: -11 },
];

const PERSONAL_TASKS: SeedTask[] = [
  { title: "Draft Q4 roadmap", project: "personal", status: "IN_PROGRESS", priority: "HIGH", assignee: 0, due: 3 },
  { title: "Book conference travel", project: "personal", status: "TODO", priority: "MEDIUM", assignee: 0, due: 10 },
  { title: "Renew domain", project: "personal", status: "DONE", priority: "LOW", assignee: 0, due: -2 },
  { title: "Read 'Designing Data-Intensive Applications'", project: "personal", status: "BACKLOG", priority: "LOW", assignee: 0, due: null },
];

/**
 * `generateTaskCode` draws from only 4096 values against a unique index, so
 * batch inserts collide often enough to matter. Hand out codes that are checked
 * against what is already stored instead.
 */
const buildCodeFactory = async (session: mongoose.ClientSession) => {
  const existing = new Set<string>(
    await TaskModel.distinct("taskCode").session(session),
  );
  let counter = 0;

  return () => {
    let code: string;
    do {
      counter += 1;
      code = `task-${counter.toString().padStart(3, "0")}`;
    } while (existing.has(code));
    existing.add(code);
    return code;
  };
};

const seedDemo = async () => {
  console.log("Seeding demo data started...");

  await connectDatabase();

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const roles = await RoleModel.find({}).session(session);
    const roleByName = new Map(roles.map((role) => [role.name, role]));

    if (!roleByName.has(Roles.OWNER) || !roleByName.has(Roles.MEMBER)) {
      throw new Error(
        "Roles are missing — run `npm run seed` before seeding demo data.",
      );
    }

    // --- Wipe anything a previous run of this script created -----------------
    const staleUsers = await UserModel.find({ email: { $in: DEMO_EMAILS } })
      .select("_id")
      .session(session);
    const staleUserIds = staleUsers.map((user) => user._id);

    if (staleUserIds.length) {
      const staleWorkspaces = await WorkspaceModel.find({
        owner: { $in: staleUserIds },
      })
        .select("_id")
        .session(session);
      const staleWorkspaceIds = staleWorkspaces.map((workspace) => workspace._id);

      await TaskModel.deleteMany({ workspace: { $in: staleWorkspaceIds } }, { session });
      await ProjectModel.deleteMany({ workspace: { $in: staleWorkspaceIds } }, { session });
      await MemberModel.deleteMany({ workspaceId: { $in: staleWorkspaceIds } }, { session });
      await WorkspaceModel.deleteMany({ _id: { $in: staleWorkspaceIds } }, { session });
      await AccountModel.deleteMany({ userId: { $in: staleUserIds } }, { session });
      await UserModel.deleteMany({ _id: { $in: staleUserIds } }, { session });

      console.log(`Cleared ${staleUserIds.length} existing demo user(s).`);
    }

    // --- Users + EMAIL provider accounts ------------------------------------
    const users: UserDocument[] = [];
    for (const seed of DEMO_USERS) {
      const user = new UserModel({
        email: seed.email,
        name: seed.name,
        password: DEMO_PASSWORD, // hashed by the pre-save hook
        lastLogin: days(-1),
      });
      await user.save({ session });

      await new AccountModel({
        userId: user._id,
        provider: ProviderEnum.EMAIL,
        providerId: seed.email,
      }).save({ session });

      users.push(user);
      console.log(`Created user ${seed.email} (${seed.role}).`);
    }

    const owner = users[0];

    // --- Workspaces ---------------------------------------------------------
    const teamWorkspace = new WorkspaceModel({
      name: "Acme Product Team",
      description: "Shared workspace for the demo — projects, tasks and roles.",
      owner: owner._id,
      inviteCode: "demo2024",
    });
    await teamWorkspace.save({ session });

    const personalWorkspace = new WorkspaceModel({
      name: "Personal",
      description: "A second workspace, to show the workspace switcher.",
      owner: owner._id,
    });
    await personalWorkspace.save({ session });

    // Every demo user joins the team workspace with their designated role; only
    // the owner belongs to the personal one.
    for (const [index, seed] of DEMO_USERS.entries()) {
      await new MemberModel({
        userId: users[index]._id,
        workspaceId: teamWorkspace._id,
        role: roleByName.get(seed.role)!._id,
        joinedAt: days(-30 + index * 3),
      }).save({ session });
    }

    await new MemberModel({
      userId: owner._id,
      workspaceId: personalWorkspace._id,
      role: roleByName.get(Roles.OWNER)!._id,
      joinedAt: days(-30),
    }).save({ session });

    owner.currentWorkspace = teamWorkspace._id as mongoose.Types.ObjectId;
    await owner.save({ session });

    for (const user of users.slice(1)) {
      user.currentWorkspace = teamWorkspace._id as mongoose.Types.ObjectId;
      await user.save({ session });
    }

    // --- Projects -----------------------------------------------------------
    const projectByKey = new Map<string, mongoose.Types.ObjectId>();

    for (const project of PROJECTS) {
      const created = new ProjectModel({
        name: project.name,
        emoji: project.emoji,
        description: project.description,
        workspace: teamWorkspace._id,
        createdBy: owner._id,
      });
      await created.save({ session });
      projectByKey.set(project.key, created._id as mongoose.Types.ObjectId);
    }

    const personalProject = new ProjectModel({
      name: "Admin & Planning",
      emoji: "🗒️",
      description: "Personal odds and ends.",
      workspace: personalWorkspace._id,
      createdBy: owner._id,
    });
    await personalProject.save({ session });
    projectByKey.set("personal", personalProject._id as mongoose.Types.ObjectId);

    console.log(`Created ${projectByKey.size} projects.`);

    // --- Tasks --------------------------------------------------------------
    const nextTaskCode = await buildCodeFactory(session);

    const buildTask = (seed: SeedTask, workspaceId: mongoose.Types.ObjectId) => ({
      taskCode: nextTaskCode(),
      title: seed.title,
      description: seed.description ?? null,
      project: projectByKey.get(seed.project),
      workspace: workspaceId,
      status: TaskStatusEnum[seed.status],
      priority: TaskPriorityEnum[seed.priority],
      assignedTo: seed.assignee === null ? null : users[seed.assignee]._id,
      createdBy: owner._id,
      dueDate: seed.due === null ? null : days(seed.due),
    });

    const documents = [
      ...TASKS.map((seed) => buildTask(seed, teamWorkspace._id as mongoose.Types.ObjectId)),
      ...PERSONAL_TASKS.map((seed) =>
        buildTask(seed, personalWorkspace._id as mongoose.Types.ObjectId),
      ),
    ];

    await TaskModel.insertMany(documents, { session });

    await session.commitTransaction();

    const overdue = documents.filter(
      (task) => task.dueDate && task.dueDate < new Date() && task.status !== TaskStatusEnum.DONE,
    ).length;
    const completed = documents.filter(
      (task) => task.status === TaskStatusEnum.DONE,
    ).length;

    console.log(`Created ${documents.length} tasks (${completed} done, ${overdue} overdue).`);
    console.log("\nDemo seeding completed successfully.");
    console.log(`  Login: ${DEMO_USERS[0].email} / ${DEMO_PASSWORD}`);
    console.log(`  Invite code: ${teamWorkspace.inviteCode}`);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

seedDemo()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Error running demo seed script:", error);
    await mongoose.disconnect();
    process.exit(1);
  });
