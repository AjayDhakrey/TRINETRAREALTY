import React, { useState } from 'react';
import type { BlogPost, LeadType } from '../types/realestate';
import { ArchitecturalImage } from '../components/ArchitecturalImage';

export interface BlogViewProps {
  posts: BlogPost[];
  onOpenLeadModal: (type: LeadType) => void;
}

export const BlogView: React.FC<BlogViewProps> = ({ posts, onOpenLeadModal }) => {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(() => posts[0] || null);

  React.useEffect(() => {
    if (!selectedPost && posts.length > 0) {
      setSelectedPost(posts[0]);
    }
  }, [posts, selectedPost]);

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-8 sm:space-y-12">
      <div className="border-b border-stone-200 pb-5 sm:pb-8">
        <div className="text-xs text-[#615E59]">
          The Architectural Ledger · Quarterly Research & Advisory Essays
        </div>
        <h1 className="font-serif-display text-2xl sm:text-5xl font-semibold text-[#141413] mt-1">
          Editorial Journal & Market Monographs
        </h1>
      </div>

      {/* Featured Active Essay Reader */}
      {selectedPost && (
        <article className="bg-[#F3F2EE] border border-stone-200 p-4 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-start">
          <div className="lg:col-span-5 space-y-4">
            <div className="aspect-[4/3] w-full bg-stone-200 overflow-hidden">
              <ArchitecturalImage
                src={selectedPost.image}
                alt={selectedPost.title}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Unboxed Metadata */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#615E59]">
              <span>{selectedPost.category}</span>
              <span aria-hidden="true">·</span>
              <span>{selectedPost.publishedAt}</span>
              <span aria-hidden="true">·</span>
              <span>{selectedPost.readTime}</span>
            </div>
            <div className="pt-2 border-t border-stone-300 text-xs">
              <div className="font-semibold text-[#141413]">{selectedPost.author}</div>
              <div className="text-[#615E59]">{selectedPost.authorRole}</div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4 sm:space-y-5">
            <h2 className="font-serif-display text-2xl sm:text-4xl font-semibold text-[#141413] leading-tight">
              {selectedPost.title}
            </h2>
            <p className="text-sm sm:text-base font-medium text-[#3F3C38] leading-relaxed">
              {selectedPost.subtitle}
            </p>
            <div className="space-y-4 pt-2 border-t border-stone-300 text-sm text-[#3F3C38] leading-relaxed max-w-[68ch]">
              {selectedPost.content.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            <div className="pt-4">
              <button
                type="button"
                onClick={() => onOpenLeadModal('Property Inquiry')}
                className="px-5 py-2.5 text-xs font-semibold bg-[#141413] text-white hover:bg-[#1E3A2F] transition-colors cursor-pointer"
              >
                Request Full Empirical Research PDF from Advisory Desk
              </button>
            </div>
          </div>
        </article>
      )}

      {/* All Journal Articles Grid */}
      <div className="space-y-4">
        <h3 className="font-serif-display text-2xl font-semibold text-[#141413]">
          All Published Monographs
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {posts.map((post) => {
            const isSelected = selectedPost?.id === post.id;
            return (
              <div
                key={post.id}
                onClick={() => {
                  setSelectedPost(post);
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
                className={`border p-5 flex flex-col justify-between cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-[#141413] bg-[#F3F2EE]'
                    : 'border-stone-200 bg-[#FBFBF9] hover:border-stone-400'
                }`}
              >
                <div className="space-y-3">
                  <div className="aspect-[4/3] w-full bg-stone-200 overflow-hidden">
                    <ArchitecturalImage
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#615E59]">
                    <span>{post.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h4 className="font-serif-display text-xl font-semibold text-[#141413] line-clamp-2">
                    {post.title}
                  </h4>
                  <p className="text-xs text-[#57534E] line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-stone-200 flex items-center justify-between text-xs">
                  <span className="text-[#615E59]">{post.author}</span>
                  <span className="font-semibold text-[#1E3A2F]">Read Essay →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

