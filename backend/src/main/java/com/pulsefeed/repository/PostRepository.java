package com.pulsefeed.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pulsefeed.model.Post;

public interface PostRepository extends JpaRepository<Post, Long> {

    List<Post> findAllByOrderByCreatedAtDesc();

    List<Post> findByUserIdOrderByCreatedAtDesc(Long userId);
}