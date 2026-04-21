import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiChat, HiThumbUp, HiReply, HiDotsVertical, HiTrash } from 'react-icons/hi';
import { commentService } from '../../services/manhwaService';
import { useAuthStore } from '../../store/authStore';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';

export default function CommentSection({ slug }) {
  const { user } = useAuthStore();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState(null); // comment object
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    fetchComments();
  }, [slug]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await commentService.getByManhwa(slug);
      setComments(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    try {
      setSubmitting(true);
      const res = await commentService.create(slug, { content });
      setComments([res.data.data, ...comments]);
      setContent('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || !user || !replyTo) return;

    try {
      setSubmitting(true);
      const res = await commentService.create(slug, { 
        content: replyContent, 
        parentId: replyTo._id 
      });
      
      const newComments = comments.map(c => {
        if (c._id === replyTo._id) {
          return { ...c, replies: [...(c.replies || []), res.data.data] };
        }
        return c;
      });
      
      setComments(newComments);
      setReplyTo(null);
      setReplyContent('');
    } catch (err) {
      console.error('Failed to reply:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await commentService.delete(id);
      setComments(comments.filter(c => c._id !== id));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  if (loading) return <div className="py-10 text-center"><Spinner /></div>;

  return (
    <div className="mt-12 max-w-4xl mx-auto w-full px-4">
      <div className="flex items-center gap-3 mb-8">
        <HiChat className="text-terra-red" size={24} />
        <h2 className="font-display text-2xl tracking-wider">COMMENTS <span className="text-terra-muted text-lg">({comments.length})</span></h2>
      </div>

      {/* Post Form */}
      {user ? (
        <form onSubmit={handlePost} className="mb-10">
          <div className="bg-terra-card border border-terra-border rounded-xl p-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Join the discussion..."
              className="w-full bg-transparent border-none focus:ring-0 text-terra-text placeholder:text-terra-muted resize-none min-h-[100px]"
            />
            <div className="flex justify-end mt-2 pt-2 border-t border-terra-border/50">
              <Button type="submit" variant="primary" size="sm" disabled={submitting || !content.trim()}>
                {submitting ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-terra-card border border-terra-border rounded-xl p-8 text-center mb-10">
          <p className="text-terra-muted mb-4">Please log in to join the conversation.</p>
          <Link to="/login"><Button variant="secondary" size="sm">Login</Button></Link>
        </div>
      )}

      {/* Comment List */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment._id} className="group">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-terra-red/10 border border-terra-red/20 shrink-0 overflow-hidden flex items-center justify-center font-display text-terra-red">
                {comment.userId?.avatar ? <img src={comment.userId.avatar} className="w-full h-full object-cover" /> : comment.userId?.username?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-terra-text">{comment.userId?.username}</span>
                    <span className="text-[10px] uppercase text-terra-muted tracking-tighter">{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  {(user?.role === 'admin' || user?._id === comment.userId?._id) && (
                    <button onClick={() => handleDelete(comment._id)} className="text-terra-muted hover:text-terra-red transition-colors opacity-0 group-hover:opacity-100">
                      <HiTrash size={14} />
                    </button>
                  )}
                </div>
                <p className="text-terra-text/90 leading-relaxed whitespace-pre-line">{comment.content}</p>
                
                <div className="flex items-center gap-4 mt-3">
                  <button className="flex items-center gap-1.5 text-xs text-terra-muted hover:text-terra-red transition-colors">
                    <HiThumbUp size={14} />
                    <span>{comment.likes || 0}</span>
                  </button>
                  <button 
                    onClick={() => setReplyTo(comment)}
                    className="flex items-center gap-1.5 text-xs text-terra-muted hover:text-terra-red transition-colors"
                  >
                    <HiReply size={14} />
                    <span>Reply</span>
                  </button>
                </div>

                {/* Reply Form */}
                {replyTo?._id === comment._id && (
                  <form onSubmit={handleReply} className="mt-4">
                    <div className="bg-terra-bg border border-terra-border rounded-lg p-3">
                      <textarea
                        autoFocus
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder={`Reply to ${comment.userId?.username}...`}
                        className="w-full bg-transparent border-none focus:ring-0 text-sm text-terra-text placeholder:text-terra-muted resize-none min-h-[60px]"
                      />
                      <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-terra-border/30">
                        <button type="button" onClick={() => setReplyTo(null)} className="text-xs text-terra-muted hover:text-terra-text">Cancel</button>
                        <Button type="submit" variant="primary" size="xs" disabled={submitting || !replyContent.trim()}>
                          {submitting ? 'Replying...' : 'Reply'}
                        </Button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Replies */}
                {comment.replies?.length > 0 && (
                  <div className="mt-4 space-y-4 pl-4 border-l-2 border-terra-border/30">
                    {comment.replies.map((reply) => (
                      <div key={reply._id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-terra-red/10 border border-terra-red/20 shrink-0 overflow-hidden flex items-center justify-center text-xs font-display text-terra-red">
                          {reply.userId?.avatar ? <img src={reply.userId.avatar} className="w-full h-full object-cover" /> : reply.userId?.username?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-semibold text-sm text-terra-text">{reply.userId?.username}</span>
                            <span className="text-[9px] uppercase text-terra-muted">{new Date(reply.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-terra-text/80 leading-relaxed">{reply.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <div className="text-center py-12 text-terra-muted border-2 border-dashed border-terra-border rounded-2xl opacity-50">
            <p>No comments yet. Be the first to start the conversation!</p>
          </div>
        )}
      </div>
    </div>
  );
}
