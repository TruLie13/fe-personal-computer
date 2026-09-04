import type { Metadata } from "next";
import { Desktop } from "@/components/desktop/Desktop";
import { LOCAL_USER_ID } from "@/lib/networkSeed";
import { DEFAULT_LOCAL_PROFILE } from "@/lib/profile";
import { profileMetaTitle } from "@/lib/seo/brand";
import {
  JsonLd,
  profileJsonLd,
  truncateDescription,
} from "@/lib/seo/jsonLd";
import {
  isLocalUsername,
  profileUrl,
} from "@/lib/seo/paths";
import { resolvePublicUser } from "@/lib/seo/publicContent";
import { resolvePublicUserAdmin } from "@/lib/seo/publicContentAdmin";
import type { NetworkUser } from "@/types/network";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

function localUserAsNetwork(): NetworkUser {
  return {
    id: LOCAL_USER_ID,
    displayName: DEFAULT_LOCAL_PROFILE.displayName,
    computerName: DEFAULT_LOCAL_PROFILE.computerName,
    bio: DEFAULT_LOCAL_PROFILE.bio,
    avatarColor: DEFAULT_LOCAL_PROFILE.avatarColor,
    avatarUrl: DEFAULT_LOCAL_PROFILE.avatarUrl,
    snapshot: {
      wallpaper: "",
      titleBarColor: "",
      icons: [],
      documents: [],
    },
  };
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  if (isLocalUsername(username)) {
    const local = localUserAsNetwork();
    return {
      title: profileMetaTitle(local.displayName),
      description: truncateDescription(local.bio),
      alternates: { canonical: profileUrl(LOCAL_USER_ID) },
      robots: { index: false, follow: false },
    };
  }
  const user =
    resolvePublicUser(username) ?? (await resolvePublicUserAdmin(username));
  if (!user) {
    return {
      title: profileMetaTitle(username),
      robots: { index: false, follow: false },
    };
  }
  return {
    title: profileMetaTitle(user.displayName),
    description: truncateDescription(user.bio),
    alternates: { canonical: profileUrl(user.id) },
  };
}

export default async function UserProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  if (isLocalUsername(username)) {
    const local = localUserAsNetwork();
    return (
      <>
        <JsonLd data={profileJsonLd(local)} />
        <Desktop deepLinkUsername={LOCAL_USER_ID} />
      </>
    );
  }

  const user =
    resolvePublicUser(username) ?? (await resolvePublicUserAdmin(username));
  if (user) {
    return (
      <>
        <JsonLd data={profileJsonLd(user)} />
        <Desktop deepLinkUsername={user.id} />
      </>
    );
  }

  // Own claimed username (client session) or unknown — Desktop decides.
  return <Desktop deepLinkUsername={username} />;
}
