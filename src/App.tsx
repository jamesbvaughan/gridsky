import { memo, useEffect, useState } from "react";
import "./lib/bsky";
import { agent } from "./lib/bsky";
import {
  ProfileView,
  ProfileViewDetailed,
} from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { FeedViewPost } from "@atproto/api/dist/client/types/app/bsky/feed/defs";

const Block = memo(function Block({ profile }: { profile: ProfileView }) {
  console.log(profile.handle);
  const [post, setPost] = useState<FeedViewPost | null>(null);

  useEffect(() => {
    agent
      .getAuthorFeed({
        actor: profile.handle,
        limit: 1,
        filter: "posts_no_replies",
      })
      .then((response) => {
        if (!response.success) {
          console.error(response.data);
          return;
        }

        setPost(response.data.feed[0]);
      });
  }, [profile.handle]);

  const profileUrl = `https://bsky.app/profile/${profile.handle}`;

  console.log(post);

  return (
    <div className="h-full overflow-scroll border-2 border-black p-2">
      <div className="flex items-start space-x-2">
        <a
          className="shrink-0"
          href={profileUrl}
          target="_blank"
          rel="noopener"
        >
          <img src={profile.avatar} height="50" width="50" />
        </a>
        <div>
          <div className="font-bold">
            <a href={profileUrl} target="_blank" rel="noopener">
              {profile.displayName ?? profile.handle}
            </a>
          </div>
          <div>{profile.description}</div>
        </div>
      </div>

      {post ? (
        <>
          {"text" in post.post.record ? post.post.record.text : null}
          {"embed" in post.post && post.post.embed != null ? (
            <>
              {"images" in post.post.embed
                ? post.post.embed.images.map((image) => (
                    <img src={image.thumb} />
                  ))
                : null}
            </>
          ) : null}
        </>
      ) : (
        "Loading..."
      )}
    </div>
  );
});

function FollowsGridInner({ follows }: { follows: ProfileView[] }) {
  const columns = 4;
  const blockHeight = 400;
  const gap = 8;

  const rowVirtualizer = useWindowVirtualizer({
    count: Math.ceil(follows.length / columns),
    estimateSize: () => blockHeight + gap,
  });

  return (
    <div
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`,
        position: "relative",
      }}
    >
      {rowVirtualizer.getVirtualItems().map((virtualItem) => {
        return (
          <div
            key={virtualItem.key}
            className="grid grid-cols-4 gap-2"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
              paddingBottom: gap,
            }}
          >
            {Array.from({ length: columns }).map((_, columnIndex) => {
              const profileIndex = virtualItem.index * columns + columnIndex;
              const profile = follows[profileIndex];
              if (profile == null) {
                return null;
              }

              return <Block profile={profile} />;
            })}
          </div>
        );
      })}
    </div>
  );
}

function FollowsGrid() {
  const [follows, setFollows] = useState<ProfileView[] | null>(null);

  useEffect(() => {
    agent.getFollows({ actor: agent.assertDid }).then((response) => {
      if (!response.success) {
        console.error(response.data);
        return;
      }

      console.log("Got follows");
      setFollows(response.data.follows);
    });
  }, []);

  if (!follows) {
    return "loading follows...";
  }

  return <FollowsGridInner follows={follows} />;
}

function Header() {
  const [profile, setProfile] = useState<ProfileViewDetailed | null>(null);

  useEffect(() => {
    agent.getProfile({ actor: agent.assertDid }).then((response) => {
      if (!response.success) {
        console.error(response.data);
        return;
      }

      setProfile(response.data);
    });
  }, []);

  return (
    <div className="flex items-center justify-between border-2 border-black p-2">
      <div className="font-bold">gridsky</div>
      {profile ? <div>Logged in as {profile.displayName}</div> : null}
    </div>
  );
}

export default function App() {
  return (
    <div className="space-y-2 p-2">
      <Header />
      <FollowsGrid />
    </div>
  );
}
