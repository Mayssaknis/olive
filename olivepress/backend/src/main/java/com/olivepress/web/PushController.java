package com.olivepress.web;

import com.olivepress.dto.PushDtos;
import com.olivepress.security.SecurityUtils;
import com.olivepress.service.PushNotificationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/push")
public class PushController {

    private final PushNotificationService pushService;

    public PushController(PushNotificationService pushService) {
        this.pushService = pushService;
    }

    @PostMapping("/register")
    public ResponseEntity<Void> register(@Valid @RequestBody PushDtos.RegisterRequest request) {
        pushService.register(request.token(), request.platform(), SecurityUtils.currentUser());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/unregister")
    public ResponseEntity<Void> unregister(@Valid @RequestBody PushDtos.UnregisterRequest request) {
        pushService.unregister(request.token());
        return ResponseEntity.noContent().build();
    }
}
