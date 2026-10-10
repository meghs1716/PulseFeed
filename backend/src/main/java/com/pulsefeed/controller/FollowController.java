package com.pulsefeed.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pulsefeed.service.FollowService;

@RestController
@RequestMapping("/api/users")
public class FollowController {

    private final FollowService followService;

    public FollowController(FollowService followService) {
        this.followService = followService;
    }

    @PostMapping("/{userId}/follow")
    public ResponseEntity<?> toggleFollow(
            @PathVariable Long userId,
            Authentication authentication) {

        try {
            boolean following = followService.toggleFollow(
                    authentication.getName(),
                    userId
            );

            long followers =
                    followService.getFollowerCount(userId);

            return ResponseEntity.ok(
                    Map.of(
                            "following", following,
                            "followerCount", followers
                    )
            );

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            e.getMessage()
                    ));
        }
    }

    @GetMapping("/{userId}/follow")
    public ResponseEntity<?> getFollowInfo(
            @PathVariable Long userId,
            Authentication authentication) {

        try {
            boolean following =
                    followService.isFollowing(
                            authentication.getName(),
                            userId
                    );

            long followers =
                    followService.getFollowerCount(userId);

            long followingCount =
                    followService.getFollowingCount(userId);

            return ResponseEntity.ok(
                    Map.of(
                            "following", following,
                            "followerCount", followers,
                            "followingCount", followingCount
                    )
            );

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            e.getMessage()
                    ));
        }
    }
}