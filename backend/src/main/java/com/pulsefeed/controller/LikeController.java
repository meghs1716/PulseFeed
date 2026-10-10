package com.pulsefeed.controller;

import com.pulsefeed.service.LikeService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/posts")
public class LikeController {

    private final LikeService likeService;

    public LikeController(LikeService likeService) {
        this.likeService = likeService;
    }

    @PostMapping("/{postId}/like")
    public ResponseEntity<?> toggleLike(
            @PathVariable Long postId,
            Authentication authentication) {

        try {
            boolean liked = likeService.toggleLike(
                    authentication.getName(),
                    postId
            );

            long count = likeService.getLikeCount(postId);

            return ResponseEntity.ok(
                    Map.of(
                            "liked", liked,
                            "likeCount", count
                    )
            );

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{postId}/likes")
    public ResponseEntity<?> getLikeInfo(
            @PathVariable Long postId,
            Authentication authentication) {

        try {
            long count = likeService.getLikeCount(postId);

            boolean liked = likeService.isLiked(
                    authentication.getName(),
                    postId
            );

            return ResponseEntity.ok(
                    Map.of(
                            "liked", liked,
                            "likeCount", count
                    )
            );

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }
}