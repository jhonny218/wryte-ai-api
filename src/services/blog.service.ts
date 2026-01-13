import { BlogStatus } from "../../generated/prisma/client";
import { prisma } from "../utils/prisma";
import { ForbiddenError, NotFoundError } from "../utils/errors";

export class BlogService {
  async getBlogs(organizationId: string) {
    return prisma.fullBlog.findMany({
      where: {
        outline: {
          blogTitle: {
            organizationId,
          },
        },
      },
      include: { 
        outline: {
          include: {
            blogTitle: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createBlog(blogOutlineId: string, data: {
    content: string;
    htmlContent: string;
    wordCount: number;
  }) {
    return prisma.fullBlog.create({
      data: {
        blogOutlineId,
        content: data.content,
        htmlContent: data.htmlContent,
        wordCount: data.wordCount,
        status: BlogStatus.DRAFT,
      },
    });
  }

  async getBlogByOutlineId(blogOutlineId: string) {
    return prisma.fullBlog.findUnique({
      where: { blogOutlineId },
      include: { 
        outline: {
          include: {
            blogTitle: true
          }
        }
      },
    });
  }

  async updateBlog(organizationId: string, blogId: string, data: {
    content?: string;
    htmlContent?: string;
    wordCount?: number;
    status?: BlogStatus;
    publishedAt?: Date | null;
    exportedAt?: Date | null;
  }) {
    // Ensure the blog exists and belongs to the organization
    const existing = await prisma.fullBlog.findUnique({
      where: { id: blogId },
      include: { 
        outline: {
          include: {
            blogTitle: true
          }
        }
      },
    });
    if (!existing) throw new NotFoundError('Blog not found');
    if (existing.outline.blogTitle.organizationId !== organizationId) {
      throw new ForbiddenError('You do not have permission to update this outline');
    }

    return prisma.fullBlog.update({
      where: { id: blogId },
      data,
    });
  }

  async deleteBlog(organizationId: string, blogId: string) {
    // Ensure the blog exists and belongs to the organization
    const existing = await prisma.fullBlog.findUnique({
      where: { id: blogId },
      include: { 
        outline: {
          include: {
            blogTitle: true
          }
        }
      },
    });
    if (!existing) throw new NotFoundError('Blog not found');
    if (existing.outline.blogTitle.organizationId !== organizationId) {
      throw new ForbiddenError('You do not have permission to delete this blog');
    }

    await prisma.fullBlog.delete({
      where: { id: blogId },
    });
  }

  async getBlog(blogId: string) {
    const blog = await prisma.fullBlog.findUnique({
      where: { id: blogId },
      include: { 
        outline: {
          include: {
            blogTitle: true
          }
        }
      },
    });
    
    if (!blog) throw new NotFoundError('Blog not found');
    return blog;
  }
}

export const blogService = new BlogService();