package com.pulsefeed.controller;

import com.pulsefeed.model.Post;
import com.pulsefeed.service.PostService;
import com.pulsefeed.service.LikeService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;
    private final LikeService likeService;

    public PostController(
            PostService postService,
            LikeService likeService) {

        this.postService = postService;
        this.likeService = likeService;
    }

    // GET ALL POSTS
    @GetMapping
    public ResponseEntity<?> getAllPosts(
            Authentication authentication) {

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            return ResponseEntity.status(401)
                    .body(Map.of(
                            "message",
                            "Unauthorized. Please login again."
                    ));
        }

        String email = authentication.getName();

        List<Post> posts = postService.getAllPosts();
        List<Map<String, Object>> response = new ArrayList<>();

        for (Post post : posts) {

            Map<String, Object> postData = buildPostResponse(
                    post,
                    email
            );

            response.add(postData);
        }

        return ResponseEntity.ok(response);
    }

    // CREATE POST
    @PostMapping
    public ResponseEntity<?> createPost(
            @RequestBody Map<String, String> request,
            Authentication authentication) {

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            return ResponseEntity.status(401)
                    .body(Map.of(
                            "message",
                            "Unauthorized. Please login again."
                    ));
        }

        try {
            String content = request.get("content");

            Post post = postService.createPost(
                    authentication.getName(),
                    content
            );

            return ResponseEntity.ok(
                    buildPostResponse(
                            post,
                            authentication.getName()
                    )
            );

        } catch (RuntimeException e) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            e.getMessage() == null
                                    ? "Could not create post"
                                    : e.getMessage()
                    ));
        }
    }

    // DELETE POST
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(
            @PathVariable Long id,
            Authentication authentication) {

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            return ResponseEntity.status(401)
                    .body(Map.of(
                            "message",
                            "Unauthorized. Please login again."
                    ));
        }

        try {
            postService.deletePost(
                    id,
                    authentication.getName()
            );

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Post deleted successfully"
                    )
            );

        } catch (RuntimeException e) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            e.getMessage() == null
                                    ? "Could not delete post"
                                    : e.getMessage()
                    ));
        }
    }

    // CONVERT POST ENTITY INTO SAFE JSON RESPONSE
    private Map<String, Object> buildPostResponse(
            Post post,
            String email) {

        Map<String, Object> postData = new HashMap<>();

        postData.put("id", post.getId());
        postData.put("content", post.getContent());
        postData.put("createdAt", post.getCreatedAt());

        Map<String, Object> userData = new HashMap<>();

        userData.put(
                "username",
                post.getUser().getUsername()
        );

        userData.put(
                "email",
                post.getUser().getEmail()
        );

        postData.put("user", userData);

        long likeCount = likeService.getLikeCount(
                post.getId()
        );

        boolean liked = likeService.isLiked(
                email,
                post.getId()
        );

        postData.put("likeCount", likeCount);
        postData.put("liked", liked);

        return postData;
    }
}