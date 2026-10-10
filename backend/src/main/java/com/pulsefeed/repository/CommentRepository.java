package com.pulsefeed.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pulsefeed.model.Comment;
import com.pulsefeed.model.Post;

public interface CommentRepository
        extends JpaRepository<Comment, Long> {

    List<Comment> findByPostOrderByCreatedAtAsc(
            Post post
    );

    long countByPost(Post post);
}