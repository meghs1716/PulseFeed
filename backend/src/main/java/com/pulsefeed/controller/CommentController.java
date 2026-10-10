package com.pulsefeed.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pulsefeed.dto.CommentRequest;
import com.pulsefeed.model.Comment;
import com.pulsefeed.model.Post;
import com.pulsefeed.model.User;
import com.pulsefeed.repository.CommentRepository;
import com.pulsefeed.repository.PostRepository;
import com.pulsefeed.repository.UserRepository;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public CommentController(
            CommentRepository commentRepository,
            PostRepository postRepository,
            UserRepository userRepository) {

        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }

    @PostMapping("/{postId}")
    public ResponseEntity<Map<String, Object>> addComment(
            @PathVariable Long postId,
            @Valid @RequestBody CommentRequest request,
            Authentication authentication) {

        User user = userRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Post post = postRepository
                .findById(postId)
                .orElseThrow(() ->
                        new RuntimeException("Post not found"));

        Comment comment = new Comment(
                request.getContent(),
                post,
                user
        );

        Comment savedComment =
                commentRepository.save(comment);

        Map<String, Object> response =
                new HashMap<>();

        response.put("id", savedComment.getId());
        response.put(
                "content",
                savedComment.getContent()
        );
        response.put(
                "username",
                user.getUsername()
        );
        response.put(
                "createdAt",
                savedComment.getCreatedAt()
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{postId}")
    public ResponseEntity<List<Map<String, Object>>> getComments(
            @PathVariable Long postId) {

        Post post = postRepository
                .findById(postId)
                .orElseThrow(() ->
                        new RuntimeException("Post not found"));

        List<Comment> comments =
                commentRepository
                        .findByPostOrderByCreatedAtAsc(post);

        List<Map<String, Object>> response =
                new ArrayList<>();

        for (Comment comment : comments) {

            Map<String, Object> data =
                    new HashMap<>();

            data.put(
                    "id",
                    comment.getId()
            );

            data.put(
                    "content",
                    comment.getContent()
            );

            data.put(
                    "username",
                    comment.getUser().getUsername()
            );

            data.put(
                    "createdAt",
                    comment.getCreatedAt()
            );

            response.add(data);
        }

        return ResponseEntity.ok(response);
    }
}