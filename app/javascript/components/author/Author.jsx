import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageFrame from "../PageFrame";
import Label from "../common/Label";
import ImageNotFound from "../common/ImageNotFound";
import moment from "moment";
import AuthorBooks from "./AuthorBooks";

export default function Author() {
  const { slug } = useParams();
  const [author, setAuthor] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [PreviewList, setPreviewList] = useState(null);
  const [previewListError, setPreviewListError] = useState(null);

  useEffect(() => {
    const url = `/api/authors/${slug}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => setAuthor(data));
  }, [slug]);

  useEffect(() => {
    let cancelled = false;

    async function loadPreviewList() {
      try {
        setPreviewListError(null);
        const res = await fetch("/api/ai_bundles/preview_list");
        if (!res.ok) throw new Error(`Bundle endpoint failed: ${res.status}`);
        const data = await res.json();
        if (!data?.url) throw new Error("Bundle endpoint did not return a url");

        const mod = await import(data.url);
        if (!mod?.default)
          throw new Error("Remote module had no default export");

        if (!cancelled) setPreviewList(() => mod.default);
      } catch (e) {
        if (!cancelled)
          setPreviewListError(
            e?.message || "Failed to load PreviewList bundle"
          );
      }
    }

    loadPreviewList();
    return () => {
      cancelled = true;
    };
  }, []);

  // if (!author || !author.id) return <p>Loading...</p>;
  if (!author) return <p>Loading...</p>;

  if (previewListError)
    return <p>Error loading preview bundle: {previewListError}</p>;
  if (!PreviewList) return <p>Loading preview bundle...</p>;

  return (
    <PreviewList items={[author]} toResponseText={JSON.stringify(author)} />
  );

  return (
    <PageFrame>
      <div className="col-span-3 self-start sticky top-20">
        <>
          {!imageError && author.photo_ids.length > 0 ? (
            <img
              src={`https://covers.openlibrary.org/b/id/${author.photo_ids[0]}-L.jpg?default=false`}
              alt={author.full_name}
              className="w-[210px] h-[210px] m-auto drop-shadow-md"
              onError={() => setImageError(true)}
            />
          ) : (
            <ImageNotFound />
          )}
        </>
      </div>
      <div className="col-span-9">
        <h1 className="font-fancy text-[36px] leading-[46px] font-[600]">
          {author.full_name}
        </h1>
        <Label
          label="Born"
          value={moment(author.birth_date).format("MMMM D, YYYY")}
        />
        {author.death_date && <Label label="Died" value={author.death_date} />}
        <div className="font-body grid grid-cols-9 gap-6 mt-3 max-h-[200px] overflow-y-auto">
          <div className="col-span-7">
            <p>{author.bio_description}</p>
          </div>
        </div>
        <div className="text-[#707070] mt-3">
          {/* <Label label="Birth Country" value={author.birth_country} /> */}
        </div>
        <AuthorBooks slug={slug} />
      </div>
    </PageFrame>
  );
}
