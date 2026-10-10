package com.pulsefeed.service;

import org.springframework.stereotype.Service;

import com.pulsefeed.model.Like;
import com.pulsefeed.model.Post;
import com.pulsefeed.model.User;
import com.pulsefeed.repository.LikeRepository;
import com.pulsefeed.repository.PostRepository;
import com.pulsefeed.repository.UserRepository;

@Service
public class LikeService {

    private final LikeRepository likeRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;

    public LikeService(
            LikeRepository likeRepository,
            UserRepository userRepository,
            PostRepository postRepository) {

        this.likeRepository = likeRepository;
        this.userRepository = userRepository;
        this.postRepository = postRepository;
    }

    public boolean toggleLike(String email, Long postId) {

        User user = userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Post post = postRepository
                .findById(postId)
                .orElseThrow(() ->
                        new RuntimeException("Post not found"));

        var existingLike = likeRepository
                .findByUserIdAndPostId(user.getId(), post.getId());

        if (existingLike.isPresent()) {
            likeRepository.delete(existingLike.get());
            return false;
        }

        Like like = new Like(user, post);
        likeRepository.save(like);

        return true;
    }

    public long getLikeCount(Long postId) {
        return likeRepository.countByPostId(postId);
    }

    public boolean isLiked(String email, Long postId) {

        User user = userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return likeRepository.existsByUserIdAndPostId(
                user.getId(),
                postId
        );
    }
}